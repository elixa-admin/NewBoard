#!/bin/bash
#
# Claude Code Token Usage Hook
#
# This script is called by Claude Code after each tool completes.
# It logs token usage to ~/.claude/token-usage.json
#
# Setup:
# 1. Copy this script to ~/.claude/scripts/log-token-usage.sh
# 2. chmod +x ~/.claude/scripts/log-token-usage.sh
# 3. Add to ~/.claude/settings.json:
#    {
#      "hooks": {
#        "onToolUseCompletion": "~/.claude/scripts/log-token-usage.sh"
#      }
#    }
#
# Expected environment variables (provided by Claude Code):
# - MODEL: the model used (haiku, sonnet, opus)
# - TOKENS: total tokens consumed
# - INPUT_TOKENS: (optional) input tokens
# - OUTPUT_TOKENS: (optional) output tokens
# - TOOL_NAME: the tool that was called
# - SKILL: (optional) the skill/plugin name
# - BRANCH: (optional) git branch name
#
# The script calls a Node.js CLI helper to handle the logging logic.

set -e

# Get the directory where this script lives
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Path to the Node.js CLI helper
# Try to find it in node_modules or use npx
CLI_HELPER="$PROJECT_ROOT/packages/backend/dist/cli/logTokenUsage.js"

# If not compiled, try to use tsx to run TypeScript directly
if [ ! -f "$CLI_HELPER" ]; then
  # Try using npx tsx if available
  if command -v npx &> /dev/null; then
    # Use tsx to run the TypeScript file
    npx tsx "$PROJECT_ROOT/packages/backend/src/cli/logTokenUsage.ts" 2>/dev/null || true
    exit 0
  else
    # Silently fail if we can't find the helper
    # This is important so the hook doesn't break Claude Code
    exit 0
  fi
fi

# Run the compiled Node.js helper
node "$CLI_HELPER" 2>/dev/null || true
