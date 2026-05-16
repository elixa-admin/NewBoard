import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  aggregateByModel,
  appendTokenCall,
  computeThresholds,
  getAllData,
  getCurrentSession,
  initializeStorage,
  updateSprintStats,
} from '../tokenStorage'
} from '../tokenStorage.js'
import type { TokenCall } from '../../types.js'

const TEST_STORAGE_PATH = path.join(process.env.HOME || '', '.claude', 'token-usage-test.json')
const ALT_STORAGE_PATH = path.join(process.env.HOME || '', '.claude', 'token-usage-test-alt.json')
const ORIGINAL_PATH = process.env.TOKEN_STORAGE_PATH

function removeIfPresent(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

beforeEach(() => {
  process.env.TOKEN_STORAGE_PATH = TEST_STORAGE_PATH
  removeIfPresent(TEST_STORAGE_PATH)
  removeIfPresent(ALT_STORAGE_PATH)
  initializeStorage()
})

afterEach(() => {
  removeIfPresent(TEST_STORAGE_PATH)
  removeIfPresent(ALT_STORAGE_PATH)
  process.env.TOKEN_STORAGE_PATH = ORIGINAL_PATH
})

describe('tokenStorage', () => {
  it('creates the storage file without creating a session', () => {
    expect(fs.existsSync(TEST_STORAGE_PATH)).toBe(true)
    expect(getCurrentSession()).toBeNull()
  })

  it('appends calls into the active session and aggregates by model', () => {
    const calls: TokenCall[] = [
      {
        timestamp: new Date().toISOString(),
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        tool: 'read',
        taskType: 'exploration',
        skillsUsed: ['read'],
      },
      {
        timestamp: new Date().toISOString(),
        model: 'haiku',
        inputTokens: 50,
        outputTokens: 100,
        totalTokens: 150,
        tool: 'grep',
        taskType: 'exploration',
        skillsUsed: ['grep'],
      },
      {
        timestamp: new Date().toISOString(),
        model: 'sonnet',
        inputTokens: 500,
        outputTokens: 1000,
        totalTokens: 1500,
        tool: 'test',
        taskType: 'critical',
        skillsUsed: ['test'],
      },
    ]

    for (const call of calls) {
      appendTokenCall(call)
    }

    const session = getCurrentSession()
    const breakdown = aggregateByModel()

    expect(session).not.toBeNull()
    expect(session!.calls).toHaveLength(3)
    expect(session!.totalTokens).toBe(1950)
    expect(breakdown.haiku.tokens).toBe(450)
    expect(breakdown.haiku.calls).toBe(2)
    expect(breakdown.sonnet.tokens).toBe(1500)
  })

  it('falls back invalid models to sonnet when storing a call', () => {
    appendTokenCall({
      timestamp: new Date().toISOString(),
      model: 'invalid' as any,
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      tool: 'read',
      taskType: 'exploration',
      skillsUsed: ['read'],
    })

    const storedCall = getCurrentSession()!.calls[0]
    expect(storedCall.model).toBe('sonnet')
  })

  it('computes warning and critical thresholds from session usage', () => {
    for (let i = 0; i < 22; i++) {
      appendTokenCall({
        timestamp: new Date().toISOString(),
        model: 'sonnet',
        inputTokens: 500,
        outputTokens: 1000,
        totalTokens: 1500,
        tool: 'test',
        taskType: 'critical',
        skillsUsed: ['test'],
      })
    }

    const warningThresholds = computeThresholds()
    expect(warningThresholds.session.level).toBe('warning')
    expect(warningThresholds.session.percent).toBeGreaterThanOrEqual(75)

    for (let i = 0; i < 4; i++) {
      appendTokenCall({
        timestamp: new Date().toISOString(),
        model: 'sonnet',
        inputTokens: 500,
        outputTokens: 1000,
        totalTokens: 1500,
        tool: 'test',
        taskType: 'critical',
        skillsUsed: ['test'],
      })
    }

    const criticalThresholds = computeThresholds()
    expect(criticalThresholds.session.level).toBe('critical')
    expect(criticalThresholds.session.percent).toBeGreaterThanOrEqual(90)
  })

  it('switches cleanly between different storage paths in the same process', () => {
    appendTokenCall({
      timestamp: new Date().toISOString(),
      model: 'haiku',
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      tool: 'read',
      taskType: 'exploration',
      skillsUsed: ['read'],
    })

    process.env.TOKEN_STORAGE_PATH = ALT_STORAGE_PATH
    initializeStorage()

    expect(getCurrentSession()).toBeNull()
    expect(Object.keys(getAllData().sessions)).toHaveLength(0)
  })

  it('uses the latest call timestamp when computing sprint duration', () => {
    appendTokenCall({
      timestamp: '2026-05-16T10:00:00.000Z',
      model: 'haiku',
      inputTokens: 100,
      outputTokens: 100,
      totalTokens: 200,
      tool: 'read',
      taskType: 'exploration',
      skillsUsed: ['read'],
    })

    appendTokenCall({
      timestamp: '2026-05-16T12:30:00.000Z',
      model: 'sonnet',
      inputTokens: 200,
      outputTokens: 300,
      totalTokens: 500,
      tool: 'test',
      taskType: 'critical',
      skillsUsed: ['test'],
    })

    updateSprintStats(new Date().toISOString().split('T')[0])

    const sprintDate = new Date().toISOString().split('T')[0]
    const sprint = getAllData().sprints[sprintDate]

    expect(sprint.totalTokens).toBe(700)
    expect(sprint.averageSessionLength).toBeCloseTo(2.5, 5)
    expect(sprint.taskBreakdown).toEqual({ exploration: 200, critical: 500 })
  })
})
