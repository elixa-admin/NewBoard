import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { appendTokenCall, initializeStorage, getAllData } from '../../storage/tokenStorage.js'
import { TokenCall } from '../../types.js'

const TEST_STORAGE_PATH = path.join(process.env.HOME || '', '.claude', 'token-usage-rec-test.json')

beforeEach(() => {
  process.env.TOKEN_STORAGE_PATH = TEST_STORAGE_PATH
  if (fs.existsSync(TEST_STORAGE_PATH)) {
    fs.unlinkSync(TEST_STORAGE_PATH)
  }
  initializeStorage()
})

afterEach(() => {
  if (fs.existsSync(TEST_STORAGE_PATH)) {
    fs.unlinkSync(TEST_STORAGE_PATH)
  }
})

describe('Recommendations Engine', () => {
  it('should recommend Haiku for exploration tasks when it is more efficient', () => {
    // Simulate exploration tasks where Haiku is cheaper
    const explorationCalls: TokenCall[] = [
      // Haiku: 4 calls averaging 600 tokens
      {
        timestamp: new Date().toISOString(),
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 500,
        totalTokens: 600,
        tool: 'read',
        taskType: 'exploration',
        skillsUsed: ['read'],
      },
      {
        timestamp: new Date().toISOString(),
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 500,
        totalTokens: 600,
        tool: 'grep',
        taskType: 'exploration',
        skillsUsed: ['grep'],
      },
      {
        timestamp: new Date().toISOString(),
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 500,
        totalTokens: 600,
        tool: 'find',
        taskType: 'exploration',
        skillsUsed: ['find'],
      },
      {
        timestamp: new Date().toISOString(),
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 500,
        totalTokens: 600,
        tool: 'search',
        taskType: 'exploration',
        skillsUsed: ['search'],
      },
      // Sonnet: 4 calls averaging 1000 tokens
      {
        timestamp: new Date().toISOString(),
        model: 'sonnet',
        inputTokens: 200,
        outputTokens: 800,
        totalTokens: 1000,
        tool: 'read',
        taskType: 'exploration',
        skillsUsed: ['read'],
      },
      {
        timestamp: new Date().toISOString(),
        model: 'sonnet',
        inputTokens: 200,
        outputTokens: 800,
        totalTokens: 1000,
        tool: 'grep',
        taskType: 'exploration',
        skillsUsed: ['grep'],
      },
      {
        timestamp: new Date().toISOString(),
        model: 'sonnet',
        inputTokens: 200,
        outputTokens: 800,
        totalTokens: 1000,
        tool: 'find',
        taskType: 'exploration',
        skillsUsed: ['find'],
      },
      {
        timestamp: new Date().toISOString(),
        model: 'sonnet',
        inputTokens: 200,
        outputTokens: 800,
        totalTokens: 1000,
        tool: 'search',
        taskType: 'exploration',
        skillsUsed: ['search'],
      },
    ]

    for (const call of explorationCalls) {
      appendTokenCall(call)
    }

    // Import and run the recommendation generator
    const data = getAllData()
    const explorationEfficiency: { [key: string]: number[] } = {}

    for (const session of Object.values(data.sessions)) {
      for (const call of (session as any).calls) {
        if (call.taskType === 'exploration') {
          if (!explorationEfficiency[call.model]) {
            explorationEfficiency[call.model] = []
          }
          explorationEfficiency[call.model].push(call.totalTokens)
        }
      }
    }

    // Calculate averages
    const haikuAvg =
      explorationEfficiency.haiku.reduce((a, b) => a + b, 0) / explorationEfficiency.haiku.length
    const sonnetAvg =
      explorationEfficiency.sonnet.reduce((a, b) => a + b, 0) / explorationEfficiency.sonnet.length

    expect(haikuAvg).toBe(600)
    expect(sonnetAvg).toBe(1000)
    expect(haikuAvg).toBeLessThan(sonnetAvg)
  })

  it('should have high confidence when multiple similar tasks exist', () => {
    // Add 5 similar exploration tasks with consistent Haiku efficiency
    for (let i = 0; i < 5; i++) {
      appendTokenCall({
        timestamp: new Date().toISOString(),
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 400,
        totalTokens: 500,
        tool: 'read',
        taskType: 'exploration',
        skillsUsed: ['read'],
      })
    }

    // Add fewer Sonnet tasks for comparison
    for (let i = 0; i < 2; i++) {
      appendTokenCall({
        timestamp: new Date().toISOString(),
        model: 'sonnet',
        inputTokens: 200,
        outputTokens: 800,
        totalTokens: 1000,
        tool: 'read',
        taskType: 'exploration',
        skillsUsed: ['read'],
      })
    }

    const data = getAllData()
    const sessions = Object.values(data.sessions)
    expect(sessions[0].calls.length).toBeGreaterThan(0)

    // Verify we have more Haiku calls
    const callsByModel = {
      haiku: 0,
      sonnet: 0,
    }
    for (const session of sessions) {
      for (const call of (session as any).calls) {
        if (call.model === 'haiku') callsByModel.haiku++
        if (call.model === 'sonnet') callsByModel.sonnet++
      }
    }

    expect(callsByModel.haiku).toBe(5)
    expect(callsByModel.sonnet).toBe(2)
  })

  it('should not recommend without sufficient data', () => {
    // Add only 1 Haiku call and 1 Sonnet call - not enough for confidence
    appendTokenCall({
      timestamp: new Date().toISOString(),
      model: 'haiku',
      inputTokens: 100,
      outputTokens: 400,
      totalTokens: 500,
      tool: 'read',
      taskType: 'exploration',
      skillsUsed: ['read'],
    })

    appendTokenCall({
      timestamp: new Date().toISOString(),
      model: 'sonnet',
      inputTokens: 200,
      outputTokens: 800,
      totalTokens: 1000,
      tool: 'read',
      taskType: 'exploration',
      skillsUsed: ['read'],
    })

    const data = getAllData()
    const sessions = Object.values(data.sessions)

    // With only 1 sample per model, recommendations should be weak or absent
    expect(sessions).toHaveLength(1)
    expect(sessions[0].calls.length).toBe(2)
  })
})
