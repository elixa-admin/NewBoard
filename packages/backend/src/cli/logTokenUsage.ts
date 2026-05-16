#!/usr/bin/env node
/**
 * CLI helper for logging token usage from Claude Code hooks.
 * Called from ~/.claude/scripts/log-token-usage.sh
 *
 * Environment variables expected:
 * - MODEL: haiku, sonnet, or opus
 * - TOKENS: total tokens consumed (or INPUT_TOKENS + OUTPUT_TOKENS)
 * - INPUT_TOKENS: (optional) input tokens
 * - OUTPUT_TOKENS: (optional) output tokens
 * - TOOL_NAME: tool that was called (read, grep, test, etc.)
 * - TASK_TYPE: (optional) 'exploration' or 'critical'. Auto-classified if not provided.
 */

import { appendTokenCall, initializeStorage } from '../storage/tokenStorage.js'
import { TokenCall } from '../types.js'

// Classify task type based on tool name
function classifyTaskType(tool: string): 'exploration' | 'critical' {
  const explorationTools = ['read', 'grep', 'find', 'search', 'browse', 'open', 'list', 'ls']
  const criticalTools = ['test', 'commit', 'deploy', 'push', 'branch', 'rebase', 'merge', 'delete', 'execute', 'run', 'build']

  const lowerTool = tool.toLowerCase().trim()

  if (explorationTools.some(t => lowerTool.includes(t))) {
    return 'exploration'
  }
  if (criticalTools.some(t => lowerTool.includes(t))) {
    return 'critical'
  }

  // Default to exploration for unknown tools
  return 'exploration'
}

function main() {
  try {
    // Initialize storage if needed
    initializeStorage()

    // Parse environment variables
    const model = (process.env.MODEL || process.env.LLM_MODEL || 'sonnet').toLowerCase().trim()
    const toolName = (process.env.TOOL_NAME || process.env.TOOL || 'unknown').toLowerCase().trim()
    const taskType = (process.env.TASK_TYPE as 'exploration' | 'critical') || classifyTaskType(toolName)

    // Parse tokens - handle both single TOKENS var and INPUT/OUTPUT split
    let inputTokens = 0
    let outputTokens = 0
    let totalTokens = 0

    if (process.env.TOKENS) {
      totalTokens = parseInt(process.env.TOKENS, 10)
      // Estimate split: typically output is ~2x input cost
      outputTokens = Math.ceil((totalTokens * 2) / 3)
      inputTokens = totalTokens - outputTokens
    } else {
      inputTokens = parseInt(process.env.INPUT_TOKENS || '0', 10)
      outputTokens = parseInt(process.env.OUTPUT_TOKENS || '0', 10)
      totalTokens = inputTokens + outputTokens
    }

    // Validate required fields
    if (totalTokens <= 0) {
      console.error('Error: No valid token count provided. Set TOKENS or INPUT_TOKENS+OUTPUT_TOKENS.')
      process.exit(1)
    }

    if (!['haiku', 'sonnet', 'opus'].includes(model)) {
      console.warn(`Warning: Unknown model '${model}', defaulting to sonnet`)
    }

    // Get optional fields
    const branchName = process.env.BRANCH_NAME || process.env.GIT_BRANCH || undefined
    const sessionId = process.env.SESSION_ID || undefined
    const skillsUsed = (process.env.SKILLS || process.env.TOOLS || toolName)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    // Build the token call object
    const call: TokenCall = {
      timestamp: new Date().toISOString(),
      model: (model as 'haiku' | 'sonnet' | 'opus') || 'sonnet',
      inputTokens,
      outputTokens,
      totalTokens,
      tool: toolName,
      taskType,
      skillsUsed,
      branchName,
    }

    // Append to storage
    appendTokenCall(call)

    // Success output for logging
    console.log(JSON.stringify({
      success: true,
      message: `Logged ${totalTokens} tokens for ${model} / ${toolName}`,
      call,
    }))

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(JSON.stringify({
      success: false,
      error: errorMessage,
      env: {
        MODEL: process.env.MODEL,
        TOKENS: process.env.TOKENS,
        TOOL_NAME: process.env.TOOL_NAME,
      },
    }))
    process.exit(1)
  }
}

main()
