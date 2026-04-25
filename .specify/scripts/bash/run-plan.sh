#!/usr/bin/env bash
# .specify/scripts/bash/run-plan.sh
#
# Canonical entry point for the speckit.plan step.
# Called by the Cursor slash command AND the Python backend (Path A).
#
# Calls setup-plan.sh to scaffold the plan file, then loads spec.md,
# the constitution, the plan template, and any optional design artifacts,
# assembles the prompt, calls the Gemini CLI, and writes plan.md.
#
# Usage:
#   run-plan.sh [OPTIONS] [free-text input]
#
# Options:
#   --json-output          Emit JSON envelope instead of raw markdown.
#   --model <model>        Gemini model (default: $GEMINI_MODEL or gemini-2.0-flash).
#   --gemini-bin <path>    Gemini binary path (default: $GEMINI_CLI_PATH or "gemini").
#   --help, -h             Show this help.
#
# Environment:
#   GEMINI_API_KEY         Required.
#   GEMINI_CLI_PATH        Override gemini binary.
#   GEMINI_MODEL           Override model.
#
# Stdout (--json-output):
#   {"IMPL_PLAN":"...","FEATURE_DIR":"...","BRANCH":"..."}
#
# Exit codes:
#   0  Success
#   1  Missing argument / prerequisite
#   2  Gemini CLI failure
#   3  setup-plan.sh failure

set -euo pipefail

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
JSON_OUTPUT=false
MODEL="${GEMINI_MODEL:-gemini-2.0-flash}"
GEMINI_BIN="${GEMINI_CLI_PATH:-gemini}"
ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json-output)  JSON_OUTPUT=true; shift ;;
        --model)        MODEL="${2:?'--model requires a value'}"; shift 2 ;;
        --gemini-bin)   GEMINI_BIN="${2:?'--gemini-bin requires a value'}"; shift 2 ;;
        --help|-h)      sed -n '2,/^$/p' "$0"; exit 0 ;;
        --) shift; ARGS+=("$@"); break ;;
        -*) echo "Error: unknown option '$1'" >&2; exit 1 ;;
        *)  ARGS+=("$1"); shift ;;
    esac
done

USER_INPUT="${ARGS[*]:-}"

if [[ -z "${GEMINI_API_KEY:-}" ]]; then
    echo "Error: GEMINI_API_KEY is not set." >&2; exit 1
fi
if ! command -v "$GEMINI_BIN" &>/dev/null; then
    echo "Error: Gemini CLI not found at '${GEMINI_BIN}'." >&2; exit 1
fi

# ---------------------------------------------------------------------------
# Step 1: Scaffold via setup-plan.sh (copies plan template, resolves paths)
# ---------------------------------------------------------------------------
SETUP_JSON=$(bash "$SCRIPT_DIR/setup-plan.sh" --json) \
    || { echo "Error: setup-plan.sh failed (exit $?)." >&2; exit 3; }

# _json_field is provided by common.sh (python3 → jq → grep fallback chain)
FEATURE_SPEC=$(_json_field "$SETUP_JSON" "FEATURE_SPEC")
IMPL_PLAN=$(_json_field    "$SETUP_JSON" "IMPL_PLAN")
FEATURE_DIR=$(_json_field  "$SETUP_JSON" "SPECS_DIR")
BRANCH=$(_json_field       "$SETUP_JSON" "BRANCH")

if [[ -z "$IMPL_PLAN" || -z "$FEATURE_DIR" ]]; then
    echo "Error: setup-plan.sh returned incomplete JSON (IMPL_PLAN or SPECS_DIR missing)." >&2
    echo "  JSON was: ${SETUP_JSON}" >&2
    exit 3
fi

REPO_ROOT=$(get_repo_root)

# ---------------------------------------------------------------------------
# Step 2: Load context
# _read_non_empty (from common.sh) skips files that exist but are empty
# (e.g. unprovisioned Supabase-synced placeholders) so Gemini sees real context.
# Prefer the feature-branch file; fall back to the Supabase-synced flat file.
# ---------------------------------------------------------------------------
SPEC_CONTENT=$(_read_non_empty "$FEATURE_SPEC")
[[ -z "$SPEC_CONTENT" ]] && SPEC_CONTENT=$(_read_non_empty "$REPO_ROOT/specs/SPECIFICATION.md")

CONSTITUTION=$(_read_non_empty "$REPO_ROOT/.specify/memory/constitution.md")
PLAN_TEMPLATE=$(_read_non_empty "$IMPL_PLAN")   # already copied by setup-plan.sh

# Optional design artifacts
RESEARCH=$(_read_non_empty "$FEATURE_DIR/research.md")
DATA_MODEL=$(_read_non_empty "$FEATURE_DIR/data-model.md")

# Optional MCP server summary (synced by backend when plan/docs phase is enabled)
MCP_CONTEXT=$(_read_non_empty "$REPO_ROOT/specs/MCP_SERVERS.md")

USER_INPUT_BLOCK=""
[[ -n "$USER_INPUT" ]] && USER_INPUT_BLOCK=$'Additional user input:\n\n'"$USER_INPUT"

# ---------------------------------------------------------------------------
# Step 3: Build prompt
# ---------------------------------------------------------------------------
PROMPT=$(cat <<PROMPT_EOF
You are a staff engineer responsible for implementation planning.

## Project Constitution

${CONSTITUTION:-No constitution found.}

---

## Feature Specification

${SPEC_CONTENT:-No specification found — use the user input below to infer scope.}

---

## Plan Template

Use the following template structure EXACTLY. Fill in all placeholders.
Preserve all section headings and their order.

${PLAN_TEMPLATE:-No plan template available — use a standard implementation plan structure.}

---

${RESEARCH:+## Research Notes

${RESEARCH}

---
}
${DATA_MODEL:+## Data Model

${DATA_MODEL}

---
}
${MCP_CONTEXT:+## Project MCP servers (Ideva Kit)

${MCP_CONTEXT}

---
}

## Your Task

Write a complete technical implementation plan for the feature.
Include:
- System architecture and major components
- Data model and integrations (aligned with the data model above if present)
- API surfaces at a high level
- Constitution Check: verify alignment with each constitution principle
- Phased delivery plan and risks

Focus on HOW to build it, technically. Be concrete and actionable.
Output ONLY the completed markdown document — no preamble or commentary.

${USER_INPUT_BLOCK}
PROMPT_EOF
)

# ---------------------------------------------------------------------------
# Step 4: Invoke Gemini CLI
# ---------------------------------------------------------------------------
PLAN_MARKDOWN=$("$GEMINI_BIN" -m "$MODEL" -p "$PROMPT") \
    || { echo "Error: Gemini CLI exited with non-zero status." >&2; exit 2; }

[[ -z "$PLAN_MARKDOWN" ]] && { echo "Error: Gemini returned empty output." >&2; exit 2; }

# ---------------------------------------------------------------------------
# Step 5: Write plan to IMPL_PLAN
# ---------------------------------------------------------------------------
printf '%s\n' "$PLAN_MARKDOWN" > "$IMPL_PLAN"

# ---------------------------------------------------------------------------
# Step 6: Emit result
# ---------------------------------------------------------------------------
if $JSON_OUTPUT; then
    printf '{"IMPL_PLAN":"%s","FEATURE_DIR":"%s","BRANCH":"%s"}\n' \
        "$IMPL_PLAN" "$FEATURE_DIR" "$BRANCH"
else
    cat "$IMPL_PLAN"
fi
