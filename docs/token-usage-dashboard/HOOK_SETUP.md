# Claude Code Hook Setup

The Token Usage Dashboard uses a Claude Code hook to automatically log token usage after each tool call. This guide walks you through setting it up.

## Current Status

- The hook flow is designed and the logger exists locally
- The real logging entrypoint is `packages/backend/src/cli/logTokenUsage.ts`
- `scripts/log-token-usage.sh` is the shell wrapper intended for Claude Code hook setup
- End-to-end hook verification should still be treated as a next-step task until it has been re-run on this machine

## What is a Hook?

A hook is a script that Claude Code runs automatically in response to events (like tool completion). The token usage hook captures data about each tool call and logs it to your local storage.

## Setup Instructions

### 1. Build the Backend (if not already built)

```bash
npm run build -w packages/backend
```

This compiles the Node.js CLI helper that the hook script will call.

Important: rebuild from source before relying on compiled backend artifacts, because checked-in `dist` output may be stale relative to `src`.

### 2. Copy the Hook Script

The hook script is located at `scripts/log-token-usage.sh` in the project. You need to copy it to your Claude Code config directory:

```bash
# Create the scripts directory if it doesn't exist
mkdir -p ~/.claude/scripts

# Copy the hook script
cp scripts/log-token-usage.sh ~/.claude/scripts/log-token-usage.sh

# Make it executable
chmod +x ~/.claude/scripts/log-token-usage.sh
```

### 3. Configure Claude Code Settings

Open or create `~/.claude/settings.json` and add the hook configuration:

```json
{
  "hooks": {
    "onToolUseCompletion": "~/.claude/scripts/log-token-usage.sh"
  }
}
```

If you already have a `settings.json` file, just add the `hooks` section. For example:

```json
{
  "model": "claude-opus-4-7",
  "theme": "dark",
  "hooks": {
    "onToolUseCompletion": "~/.claude/scripts/log-token-usage.sh"
  }
}
```

### 4. Verify Setup

To verify the hook is working, you can manually simulate a hook call:

```bash
# Simulate a read operation with Haiku
export MODEL=haiku TOKENS=150 TOOL_NAME=read
~/.claude/scripts/log-token-usage.sh

# Check that data was logged
cat ~/.claude/token-usage.json | jq '.sessions' | head -20
```

You should see a new session with one call logged.

## How It Works

When Claude Code completes a tool call, it runs the hook script with environment variables describing the operation:

- `MODEL`: The model used (haiku, sonnet, opus)
- `TOKENS`: Total tokens consumed
- `INPUT_TOKENS` / `OUTPUT_TOKENS`: (optional) Separate input/output token counts
- `TOOL_NAME`: The tool that was called (read, write, execute, etc.)
- `BRANCH`: (optional) Current git branch
- `SKILLS`: (optional) Comma-separated list of skills used

The hook script:
1. Receives these environment variables
2. Classifies the task type (exploration vs critical) based on the tool
3. Calls a Node.js CLI helper to log the data
4. Appends the token call to `~/.claude/token-usage.json`

If the storage file doesn't exist, it's created automatically. If the hook fails for any reason, Claude Code continues normally (the hook never blocks execution).

## Environment Variables Reference

### Provided by Claude Code

| Variable | Example | Description |
|----------|---------|-------------|
| `MODEL` | `sonnet` | The LLM model used |
| `TOKENS` | `500` | Total tokens consumed |
| `INPUT_TOKENS` | `100` | Tokens in the input |
| `OUTPUT_TOKENS` | `400` | Tokens in the output |
| `TOOL_NAME` | `read` | The tool that was executed |
| `BRANCH` | `feature/dashboard` | Current git branch |
| `SKILLS` | `read,grep` | Skills/tools used |

### Task Classification

The hook automatically classifies tasks based on the tool:

**Exploration Tasks** (prefer Haiku):
- `read`: Reading files
- `grep`: Searching code
- `find`: Finding files
- `search`: Broad searching
- `browse`: Browsing directories
- `open`: Opening files

**Critical Tasks** (prefer Sonnet/Opus):
- `test`: Running tests
- `commit`: Committing code
- `deploy`: Deploying changes
- `push`: Pushing to git
- `build`: Building projects
- `execute`: Running scripts

Unknown tools default to "exploration."

## Troubleshooting

### Hook not firing

1. Check that `~/.claude/settings.json` has the hook configured correctly
2. Restart Claude Code after updating settings
3. Check `~/.claude/token-usage.json` to see if data is being logged

### No data being logged

1. Run the manual simulation command above to verify the script works
2. Check that `~/.claude/scripts/log-token-usage.sh` is executable: `ls -la ~/.claude/scripts/log-token-usage.sh`
3. The Node.js CLI helper must be compiled: run `npm run build -w packages/backend`
4. Check that `~/.claude/token-usage.json` exists and is readable

### Project Root Issue

The hook script tries to find the project root automatically. If the relative path calculation fails:

1. Edit `~/.claude/scripts/log-token-usage.sh`
2. Change `PROJECT_ROOT` to the absolute path of your NewBoard directory:
   ```bash
   PROJECT_ROOT="/path/to/NewBoard"
   ```

## Dashboard Integration

Once the hook is set up and logging data, start the dashboard to view token usage:

```bash
npm run dev
```

Then open http://localhost:4200 in your browser to see real-time token tracking.

## Disabling the Hook

To temporarily disable the hook without removing the configuration:

1. Edit `~/.claude/settings.json`
2. Comment out or remove the `hooks` section
3. Restart Claude Code

To permanently remove:

```bash
rm ~/.claude/scripts/log-token-usage.sh
```

And remove the `hooks` section from `~/.claude/settings.json`.
