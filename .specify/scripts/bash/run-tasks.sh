#!/usr/bin/env bash
# .specify/scripts/bash/run-tasks.sh
#
# Canonical entry point for the speckit.tasks step.
# Called by the Cursor slash command AND the Python backend (Path A).
#
# Calls check-prerequisites.sh to validate the workspace, loads spec.md,
# plan.md, the constitution, and the tasks template, assembles the prompt,
# calls the Gemini CLI, and writes tasks.md.
#
# Usage:
#   run-tasks.sh [OPTIONS] [free-text input]
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
#   {"TASKS_FILE":"...","FEATURE_DIR":"...","BRANCH":"..."}
#
# Exit codes:
#   0  Success
#   1  Missing argument / prerequisite
#   2  Gemini CLI failure
#   3  Prerequisite check failure

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
# Step 1: Validate prerequisites (spec.md + plan.md must exist)
# ---------------------------------------------------------------------------
PREREQ_JSON=$(bash "$SCRIPT_DIR/check-prerequisites.sh" --json) \
    || { echo "Error: check-prerequisites.sh failed (exit $?)." >&2; exit 3; }

# _json_field is provided by common.sh (python3 → jq → grep fallback chain)
FEATURE_DIR=$(_json_field "$PREREQ_JSON" "FEATURE_DIR")
BRANCH=$(get_current_branch)

if [[ -z "$FEATURE_DIR" ]]; then
    echo "Error: check-prerequisites.sh returned incomplete JSON (FEATURE_DIR missing)." >&2
    echo "  JSON was: ${PREREQ_JSON}" >&2
    exit 3
fi

REPO_ROOT=$(get_repo_root)
TASKS_FILE="$FEATURE_DIR/tasks.md"

# ---------------------------------------------------------------------------
# Step 2: Load context
# _read_non_empty (from common.sh) skips files that exist but are empty
# (e.g. unprovisioned Supabase-synced placeholders) so Gemini sees real context.
# Prefer the feature-branch file; fall back to the Supabase-synced flat file.
# ---------------------------------------------------------------------------
SPEC_CONTENT=$(_read_non_empty "$FEATURE_DIR/spec.md")
[[ -z "$SPEC_CONTENT" ]] && SPEC_CONTENT=$(_read_non_empty "$REPO_ROOT/specs/SPECIFICATION.md")

PLAN_CONTENT=$(_read_non_empty "$FEATURE_DIR/plan.md")
[[ -z "$PLAN_CONTENT" ]] && PLAN_CONTENT=$(_read_non_empty "$REPO_ROOT/specs/PLAN.md")

CONSTITUTION=$(_read_non_empty "$REPO_ROOT/.specify/memory/constitution.md")
TASKS_TEMPLATE=$(_read_non_empty "$REPO_ROOT/.specify/templates/tasks-template.md")

# Optional refinement context (design references, acceptance criteria, UX notes)
REFINEMENT=$(_read_non_empty "$REPO_ROOT/specs/REFINEMENT.md")

# Optional MCP server summary (synced by backend when plan/docs phase is enabled)
MCP_CONTEXT=$(_read_non_empty "$REPO_ROOT/specs/MCP_SERVERS.md")

# Optional artifacts
RESEARCH=$(_read_non_empty "$FEATURE_DIR/research.md")
DATA_MODEL=$(_read_non_empty "$FEATURE_DIR/data-model.md")

CONTRACTS_BLOCK=""
if [[ -d "$FEATURE_DIR/contracts" ]]; then
    for f in "$FEATURE_DIR/contracts"/*.md; do
        [[ -f "$f" && -s "$f" ]] || continue   # skip missing or empty files
        CONTRACTS_BLOCK+="#### $(basename "$f")"$'\n\n'"$(cat "$f")"$'\n\n'
    done
fi

USER_INPUT_BLOCK=""
[[ -n "$USER_INPUT" ]] && USER_INPUT_BLOCK=$'Additional user input:\n\n'"$USER_INPUT"

# ---------------------------------------------------------------------------
# Step 3: Build prompt
# ---------------------------------------------------------------------------
PROMPT=$(cat <<PROMPT_EOF
You are a staff engineer breaking an implementation plan into an actionable task list.

## Project Constitution

${CONSTITUTION:-No constitution found.}

---

## Feature Specification

${SPEC_CONTENT:-No specification found.}

---

## Implementation Plan

${PLAN_CONTENT:-No plan found.}

---

${REFINEMENT:+## Refinement (Design References & Acceptance Criteria)

${REFINEMENT}

---
}
${RESEARCH:+## Research Notes

${RESEARCH}

---
}
${DATA_MODEL:+## Data Model

${DATA_MODEL}

---
}
${CONTRACTS_BLOCK:+## Interface Contracts

${CONTRACTS_BLOCK}---
}
${MCP_CONTEXT:+## Project MCP servers (Ideva Kit)

${MCP_CONTEXT}

---
}

## Tasks Template

Use this structure EXACTLY. Fill in all placeholders.

${TASKS_TEMPLATE:-Use a standard phased task list structure.}

---

## Your Task

Generate a complete, dependency-ordered tasks.md for the feature.

Task format (REQUIRED for every task):
  - [ ] [TaskID] [P] [StoryLabel] Description with exact file path

Rules:
- TaskID: T001, T002, T003, … in execution order.
- [P] marker: include ONLY if the task is parallelisable (different files, no blocking deps).
- [StoryLabel]: [US1], [US2], … — required for user-story phase tasks; omit in Setup/Foundational/Polish phases.
- File path: every task must name the exact file it touches.
- Organise phases: Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3+ (one per user story, priority order) → Final (Polish).
- Phase headings MUST use EXACTLY "## Phase N" (two hash marks, e.g. "## Phase 1", "## Phase 2"). No other heading depth or wording.
- Tests are OPTIONAL; only include if explicitly requested.

Output ONLY the completed markdown document — no preamble or commentary.

${USER_INPUT_BLOCK}
PROMPT_EOF
)

# ---------------------------------------------------------------------------
# Step 4: Invoke Gemini CLI
# ---------------------------------------------------------------------------
TASKS_MARKDOWN=$("$GEMINI_BIN" -m "$MODEL" -p "$PROMPT") \
    || { echo "Error: Gemini CLI exited with non-zero status." >&2; exit 2; }

[[ -z "$TASKS_MARKDOWN" ]] && { echo "Error: Gemini returned empty output." >&2; exit 2; }

# ---------------------------------------------------------------------------
# Step 5: Write tasks.md
# ---------------------------------------------------------------------------
printf '%s\n' "$TASKS_MARKDOWN" > "$TASKS_FILE"

# ---------------------------------------------------------------------------
# Step 6: Emit result
# ---------------------------------------------------------------------------
if $JSON_OUTPUT; then
    printf '{"TASKS_FILE":"%s","FEATURE_DIR":"%s","BRANCH":"%s"}\n' \
        "$TASKS_FILE" "$FEATURE_DIR" "$BRANCH"
else
    cat "$TASKS_FILE"
fi
