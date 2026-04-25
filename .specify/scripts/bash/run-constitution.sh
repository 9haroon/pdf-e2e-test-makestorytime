#!/usr/bin/env bash
# .specify/scripts/bash/run-constitution.sh
#
# Canonical entry point for the speckit.constitution step.
# Called by the Cursor slash command AND the Python backend (Path A).
#
# Reads the constitution template, assembles any requirement context from
# specs/, calls the Gemini CLI, and writes the result to
# .specify/memory/constitution.md.
#
# Usage:
#   run-constitution.sh [OPTIONS] [free-text input]
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
#   {"CONSTITUTION_FILE":"..."}
#
# Exit codes:
#   0  Success
#   1  Missing argument / prerequisite
#   2  Gemini CLI failure

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

REPO_ROOT=$(get_repo_root)
CONSTITUTION_FILE="$REPO_ROOT/.specify/memory/constitution.md"
mkdir -p "$(dirname "$CONSTITUTION_FILE")"

# ---------------------------------------------------------------------------
# Step 1: Load context
# _read_non_empty (from common.sh) skips files that exist but are empty.
# ---------------------------------------------------------------------------
CONSTITUTION_TEMPLATE=$(_read_non_empty "$REPO_ROOT/.specify/templates/constitution-template.md")
EXISTING_CONSTITUTION=$(_read_non_empty "$CONSTITUTION_FILE")

# Collect requirements context from synced specs/
# Skip empty files (unprovisioned Supabase-synced placeholders).
REQUIREMENTS_BLOCK=""
SPECS_ROOT="$REPO_ROOT/specs"
if [[ -d "$SPECS_ROOT" ]]; then
    for f in "$SPECS_ROOT"/*.md; do
        [[ -f "$f" && -s "$f" ]] || continue   # skip missing or empty files
        fname=$(basename "$f")
        REQUIREMENTS_BLOCK+="### ${fname}"$'\n\n'"$(cat "$f")"$'\n\n'
    done
fi
REQUIREMENTS_BLOCK="${REQUIREMENTS_BLOCK:-No existing Spec Kit documents found.}"

USER_INPUT_BLOCK=""
[[ -n "$USER_INPUT" ]] && USER_INPUT_BLOCK=$'Additional user input:\n\n'"$USER_INPUT"

TODAY=$(date -I)

# ---------------------------------------------------------------------------
# Step 2: Build prompt
# ---------------------------------------------------------------------------
PROMPT=$(cat <<PROMPT_EOF
You are a senior engineering leader helping a team define project principles.

## Task

${EXISTING_CONSTITUTION:+Update the existing constitution below.}${EXISTING_CONSTITUTION:-Write a new project constitution using the template below.}

Fill in all placeholder tokens (text in [SQUARE_BRACKETS]) with concrete values.
Follow the semantic versioning rules for CONSTITUTION_VERSION:
- MAJOR: backward-incompatible principle removal or redefinition.
- MINOR: new principle or material expansion.
- PATCH: clarification, wording, typo fixes.

Set LAST_AMENDED_DATE to ${TODAY}.
Prepend a Sync Impact Report as an HTML comment at the top (version change, modified/added/removed principles).
Output ONLY the completed markdown document — no preamble or commentary.

## Constitution Template

${CONSTITUTION_TEMPLATE}

## Existing Constitution (if any)

${EXISTING_CONSTITUTION:-None.}

## Existing Project Documents (for context)

${REQUIREMENTS_BLOCK}

${USER_INPUT_BLOCK}
PROMPT_EOF
)

# ---------------------------------------------------------------------------
# Step 3: Invoke Gemini CLI
# ---------------------------------------------------------------------------
CONSTITUTION_MARKDOWN=$("$GEMINI_BIN" -m "$MODEL" -p "$PROMPT") \
    || { echo "Error: Gemini CLI exited with non-zero status." >&2; exit 2; }

[[ -z "$CONSTITUTION_MARKDOWN" ]] && { echo "Error: Gemini returned empty output." >&2; exit 2; }

# ---------------------------------------------------------------------------
# Step 4: Write to canonical path
# ---------------------------------------------------------------------------
printf '%s\n' "$CONSTITUTION_MARKDOWN" > "$CONSTITUTION_FILE"

# ---------------------------------------------------------------------------
# Step 5: Emit result
# ---------------------------------------------------------------------------
if $JSON_OUTPUT; then
    printf '{"CONSTITUTION_FILE":"%s"}\n' "$CONSTITUTION_FILE"
else
    cat "$CONSTITUTION_FILE"
fi
