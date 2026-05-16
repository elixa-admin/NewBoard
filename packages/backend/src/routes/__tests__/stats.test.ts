import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import http from 'http'
import type { AddressInfo } from 'net'
import type { Server } from 'http'
import { createApp } from '../../server.js'
import { appendTokenCall, initializeStorage } from '../../storage/tokenStorage.js'
import type { TokenCall } from '../../types.js'

const TEST_STORAGE_PATH = path.join(process.env.HOME || '', '.claude', 'token-usage-api-test.json')
const ORIGINAL_PATH = process.env.TOKEN_STORAGE_PATH

let server: Server
let baseUrl: string

async function getJson(route: string) {
  return await new Promise<{ status: number; body: any }>((resolve, reject) => {
    const request = http.get(`${baseUrl}${route}`, (response) => {
      let raw = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        raw += chunk
      })
      response.on('end', () => {
        resolve({
          status: response.statusCode || 0,
          body: JSON.parse(raw),
        })
      })
    })

    request.on('error', reject)
    request.end()
  })
}

beforeEach(async () => {
  process.env.TOKEN_STORAGE_PATH = TEST_STORAGE_PATH
  if (fs.existsSync(TEST_STORAGE_PATH)) {
    fs.unlinkSync(TEST_STORAGE_PATH)
  }
  initializeStorage()

  server = createApp().listen(0)
  server.unref()
  await new Promise<void>((resolve) => server.once('listening', () => resolve()))
  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterEach(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })

  if (fs.existsSync(TEST_STORAGE_PATH)) {
    fs.unlinkSync(TEST_STORAGE_PATH)
  }
  process.env.TOKEN_STORAGE_PATH = ORIGINAL_PATH
})

describe('Stats API', () => {
  it('returns a null current session when no calls have been logged', async () => {
    const res = await getJson('/api/session/current')

    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()
    expect(res.body.alerts).toEqual([])
  })

  it('returns session stats at the documented endpoint path', async () => {
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

    const res = await getJson('/api/session/current')

    expect(res.status).toBe(200)
    expect(res.body.data.totalTokens).toBe(1800)
    expect(res.body.data.callCount).toBe(2)
    expect(res.body.data.modelBreakdown.haiku.tokens).toBe(300)
    expect(res.body.data.modelBreakdown.sonnet.tokens).toBe(1500)
  })

  it('aggregates model totals through the stats endpoint', async () => {
    for (const call of [
      {
        timestamp: new Date().toISOString(),
        model: 'haiku',
        inputTokens: 50,
        outputTokens: 100,
        totalTokens: 150,
        tool: 'read',
        taskType: 'exploration',
        skillsUsed: ['read'],
      },
      {
        timestamp: new Date().toISOString(),
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
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
    ] satisfies TokenCall[]) {
      appendTokenCall(call)
    }

    const res = await getJson('/api/stats/models')

    expect(res.status).toBe(200)
    expect(res.body.summary.totalTokens).toBe(1950)
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ model: 'haiku', calls: 2, tokens: 450 }),
        expect.objectContaining({ model: 'sonnet', calls: 1, tokens: 1500 }),
      ]),
    )
  })

  it('builds trends from call timestamps rather than session start time', async () => {
    appendTokenCall({
      timestamp: '2026-05-15T10:15:00.000Z',
      model: 'haiku',
      inputTokens: 100,
      outputTokens: 100,
      totalTokens: 200,
      tool: 'read',
      taskType: 'exploration',
      skillsUsed: ['read'],
    })

    appendTokenCall({
      timestamp: '2026-05-16T11:45:00.000Z',
      model: 'sonnet',
      inputTokens: 200,
      outputTokens: 300,
      totalTokens: 500,
      tool: 'test',
      taskType: 'critical',
      skillsUsed: ['test'],
    })

    const res = await getJson('/api/stats/trends/daily')

    expect(res.status).toBe(200)
    expect(res.body.summary.totalTokens).toBe(700)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data.map((bucket: { tokens: number }) => bucket.tokens)).toEqual([200, 500])
  })
})
