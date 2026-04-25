#!/usr/bin/env bash
# .specify/scripts/bash/run-specify.sh
#
# Canonical entry point for the speckit.specify step.
# This is the single script that BOTH the Cursor slash command and the
# Python backend (Path A) call, ensuring identical scaffolding, context
# assembly, Gemini invocation, and file layout.
#
# Usage:
#   run-specify.sh [OPTIONS] <feature_description>
#
# Options:
#   --json-output          Emit a JSON envelope on stdout instead of the
#                          raw markdown (used by the backend to parse paths).
#   --short-name <name>    2-4 word slug for the branch/directory name.
#                          Auto-generated from the description when omitted.
#   --number <N>           Override the auto-detected branch number.
#   --model <model>        Gemini model to use (default: $GEMINI_MODEL or
#                          gemini-2.0-flash).
#   --gemini-bin <path>    Path to the gemini binary (default: $GEMINI_CLI_PATH
#                          or "gemini").
#   --help, -h             Show this help.
#
# Environment:
#   GEMINI_API_KEY         Required. Passed through to the Gemini CLI.
#   GEMINI_CLI_PATH        Override the gemini binary location.
#   GEMINI_MODEL           Override the Gemini model.
#
# Stdout (--json-output):
#   {"BRANCH_NAME":"...","SPEC_FILE":"...","FEATURE_NUM":"...","CHECKLIST_FILE":"..."}
#
# Stdout (default):
#   Raw generated spec markdown (what was written to SPEC_FILE).
#
# Exit codes:
#   0  Success
#   1  Missing required argument or prerequisite
#   2  Gemini CLI invocation failed
#   3  Scaffold script failed

set -euo pipefail

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
JSON_OUTPUT=false
SHORT_NAME=""
BRANCH_NUMBER=""
MODEL="${GEMINI_MODEL:-gemini-2.0-flash}"
GEMINI_BIN="${GEMINI_CLI_PATH:-gemini}"
ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json-output)  JSON_OUTPUT=true; shift ;;
        --short-name)   SHORT_NAME="${2:?'--short-name requires a value'}"; shift 2 ;;
        --number)       BRANCH_NUMBER="${2:?'--number requires a value'}"; shift 2 ;;
        --model)        MODEL="${2:?'--model requires a value'}"; shift 2 ;;
        --gemini-bin)   GEMINI_BIN="${2:?'--gemini-bin requires a value'}"; shift 2 ;;
        --help|-h)
            sed -n '2,/^$/p' "$0"   # print the header comment block
            exit 0
            ;;
        --) shift; ARGS+=("$@"); break ;;
        -*) echo "Error: unknown option '$1'" >&2; exit 1 ;;
        *)  ARGS+=("$1"); shift ;;
    esac
done

FEATURE_DESCRIPTION="${ARGS[*]:-}"
if [[ -z "$FEATURE_DESCRIPTION" ]]; then
    echo "Error: feature description is required." >&2
    echo "Usage: $0 [OPTIONS] <feature_description>" >&2
    exit 1
fi

if [[ -z "${GEMINI_API_KEY:-}" ]]; then
    echo "Error: GEMINI_API_KEY is not set." >&2
    exit 1
fi

if ! command -v "$GEMINI_BIN" &>/dev/null; then
    echo "Error: Gemini CLI not found at '${GEMINI_BIN}'." >&2
    echo "Set GEMINI_CLI_PATH or pass --gemini-bin <path>." >&2
    exit 1
fi

REPO_ROOT=$(get_repo_root)

# ---------------------------------------------------------------------------
# Step 1: Scaffold feature directory + git branch via create-new-feature.sh
# ---------------------------------------------------------------------------
SCAFFOLD_ARGS=("--json")
[[ -n "$SHORT_NAME" ]]    && SCAFFOLD_ARGS+=("--short-name" "$SHORT_NAME")
[[ -n "$BRANCH_NUMBER" ]] && SCAFFOLD_ARGS+=("--number"     "$BRANCH_NUMBER")

SCAFFOLD_JSON=$(bash "$SCRIPT_DIR/create-new-feature.sh" "${SCAFFOLD_ARGS[@]}" "$FEATURE_DESCRIPTION") \
    || { echo "Error: create-new-feature.sh failed (exit $?)." >&2; exit 3; }

# _json_field is provided by common.sh (python3 → jq → grep fallback chain)
BRANCH_NAME=$(_json_field "$SCAFFOLD_JSON" "BRANCH_NAME")
SPEC_FILE=$(_json_field   "$SCAFFOLD_JSON" "SPEC_FILE")
FEATURE_NUM=$(_json_field "$SCAFFOLD_JSON" "FEATURE_NUM")
FEATURE_DIR=$(dirname "$SPEC_FILE")

if [[ -z "$SPEC_FILE" || -z "$BRANCH_NAME" ]]; then
    echo "Error: create-new-feature.sh returned incomplete JSON (SPEC_FILE or BRANCH_NAME missing)." >&2
    echo "  JSON was: ${SCAFFOLD_JSON}" >&2
    exit 3
fi

# ---------------------------------------------------------------------------
# Step 2: Assemble context (constitution + template + existing specs)
# _read_non_empty (from common.sh) skips files that exist but are empty
# (e.g. unprovisioned Supabase-synced placeholders) so Gemini sees real context.
# ---------------------------------------------------------------------------
CONSTITUTION=$(_read_non_empty "$REPO_ROOT/.specify/memory/constitution.md")
SPEC_TEMPLATE=$(_read_non_empty "$REPO_ROOT/.specify/templates/spec-template.md")

# Collect any pre-existing Spec Kit documents synced to specs/
# Skip empty files to avoid sending blank context sections to Gemini.
EXISTING_DOCS_BLOCK=""
SPECS_ROOT="$REPO_ROOT/specs"
if [[ -d "$SPECS_ROOT" ]]; then
    for f in "$SPECS_ROOT"/*.md; do
        [[ -f "$f" && -s "$f" ]] || continue   # skip missing or empty files
        fname=$(basename "$f")
        EXISTING_DOCS_BLOCK+="### ${fname}"$'\n\n'"$(cat "$f")"$'\n\n'
    done
fi
EXISTING_DOCS_BLOCK="${EXISTING_DOCS_BLOCK:-No existing Spec Kit documents found.}"

# ---------------------------------------------------------------------------
# Step 3: Build prompt (single source of truth — backend uses this verbatim)
# ---------------------------------------------------------------------------
#
# IMPORTANT: This heredoc IS the canonical prompt for speckit.specify.
# Any change here propagates to both the Cursor slash command and the backend.
#
PROMPT=$(cat <<PROMPT_EOF
You are acting as a staff engineer and product partner writing a feature specification.

## Project Constitution

${CONSTITUTION}

---

## Spec Template

Use the following template structure EXACTLY for the output document.
Replace every placeholder (text inside [square brackets]) with real content.
Preserve all section headings and their order.

${SPEC_TEMPLATE}

---

## Existing Project Context

The following documents have already been generated for this project.
Use them to ensure consistency and avoid contradicting prior decisions:

${EXISTING_DOCS_BLOCK}

---

## Your Task

Write a complete feature specification for the feature described below.

**Feature**: ${FEATURE_DESCRIPTION}
**Branch**: ${BRANCH_NAME}

Rules:
- Fill in the template above with concrete details derived from the feature description.
- Focus on WHAT users need and WHY — not HOW to implement it.
- Avoid all technology-specific language (no frameworks, languages, or APIs).
- Success criteria must be measurable and technology-agnostic.
- Where requirements are unclear, insert exactly this marker:
    [NEEDS CLARIFICATION: <specific question>]
  Use at most 3 such markers; prioritise by scope, then security, then UX.
- Make reasonable informed guesses for everything else.
- Output ONLY the completed markdown document. No preamble or commentary.
PROMPT_EOF
)

# ---------------------------------------------------------------------------
# Step 4: Invoke Gemini CLI
# ---------------------------------------------------------------------------
SPEC_MARKDOWN=$("$GEMINI_BIN" -m "$MODEL" -p "$PROMPT") \
    || { echo "Error: Gemini CLI exited with non-zero status." >&2; exit 2; }

if [[ -z "$SPEC_MARKDOWN" ]]; then
    echo "Error: Gemini CLI returned empty output." >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# Step 5: Write spec to SPEC_FILE (created by scaffold step)
# ---------------------------------------------------------------------------
printf '%s\n' "$SPEC_MARKDOWN" > "$SPEC_FILE"

# ---------------------------------------------------------------------------
# Step 6: Initialise quality checklist scaffold
# ---------------------------------------------------------------------------
CHECKLIST_DIR="$FEATURE_DIR/checklists"
mkdir -p "$CHECKLIST_DIR"
CHECKLIST_FILE="$CHECKLIST_DIR/requirements.md"

cat > "$CHECKLIST_FILE" <<CHECKLIST_EOF
# Specification Quality Checklist: ${BRANCH_NAME}

**Purpose**: Validate specification completeness before proceeding to planning
**Created**: $(date -I)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

## Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Success criteria are technology-agnostic (no implementation details)
- [ ] All acceptance scenarios are defined
- [ ] Edge cases are identified
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

## Feature Readiness

- [ ] All functional requirements have clear acceptance criteria
- [ ] User scenarios cover primary flows
- [ ] Feature meets measurable outcomes defined in Success Criteria
- [ ] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before \`/speckit.clarify\` or \`/speckit.plan\`
CHECKLIST_EOF

# ---------------------------------------------------------------------------
# Step 7: Emit result
# ---------------------------------------------------------------------------
if $JSON_OUTPUT; then
    printf '{"BRANCH_NAME":"%s","SPEC_FILE":"%s","FEATURE_NUM":"%s","CHECKLIST_FILE":"%s"}\n' \
        "$BRANCH_NAME" "$SPEC_FILE" "$FEATURE_NUM" "$CHECKLIST_FILE"
else
    cat "$SPEC_FILE"
fi
