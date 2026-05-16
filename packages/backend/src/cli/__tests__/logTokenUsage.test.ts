import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { getAllData, initializeStorage } from '../../storage/tokenStorage.js'

const TEST_STORAGE_PATH = path.join(process.env.HOME || '', '.claude', 'token-usage-cli-test.json')

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

describe('logTokenUsage CLI', () => {
  it('should log token usage with TOKENS env var', () => {
    const env = {
      ...process.env,
      MODEL: 'sonnet',
      TOKENS: '500',
      TOOL_NAME: 'read',
      TOKEN_STORAGE_PATH: TEST_STORAGE_PATH,
    }

    execSync('npx tsx src/cli/logTokenUsage.ts', {
      env,
      stdio: 'pipe',
      cwd: path.join(__dirname, '../../..'),
    })

    const data = getAllData()
    const sessions = Object.values(data.sessions)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].calls).toHaveLength(1)
    expect(sessions[0].calls[0].totalTokens).toBe(500)
    expect(sessions[0].calls[0].model).toBe('sonnet')
  })

  it('should classify exploration tasks correctly', () => {
    const explorationTools = ['read', 'grep', 'find', 'search', 'browse']

    for (const tool of explorationTools) {
      const testPath = path.join(process.env.HOME || '', `.claude/token-usage-${tool}-test.json`)
      process.env.TOKEN_STORAGE_PATH = testPath

      if (fs.existsSync(testPath)) {
        fs.unlinkSync(testPath)
      }
      initializeStorage()

      const env = {
        ...process.env,
        MODEL: 'haiku',
        TOKENS: '100',
        TOOL_NAME: tool,
        TOKEN_STORAGE_PATH: testPath,
      }

      execSync('npx tsx src/cli/logTokenUsage.ts', {
        env,
        stdio: 'pipe',
        cwd: path.join(__dirname, '../../..'),
      })

      const data = getAllData()
      const session = Object.values(data.sessions)[0]
      expect(session.calls[0].taskType).toBe('exploration', `${tool} should be exploration`)

      fs.unlinkSync(testPath)
    }
  })

  it('should classify critical tasks correctly', () => {
    const criticalTools = ['test', 'commit', 'deploy', 'push', 'build']

    for (const tool of criticalTools) {
      const testPath = path.join(process.env.HOME || '', `.claude/token-usage-${tool}-test.json`)
      process.env.TOKEN_STORAGE_PATH = testPath

      if (fs.existsSync(testPath)) {
        fs.unlinkSync(testPath)
      }
      initializeStorage()

      const env = {
        ...process.env,
        MODEL: 'sonnet',
        TOKENS: '1000',
        TOOL_NAME: tool,
        TOKEN_STORAGE_PATH: testPath,
      }

      execSync('npx tsx src/cli/logTokenUsage.ts', {
        env,
        stdio: 'pipe',
        cwd: path.join(__dirname, '../../..'),
      })

      const data = getAllData()
      const session = Object.values(data.sessions)[0]
      expect(session.calls[0].taskType).toBe('critical', `${tool} should be critical`)

      fs.unlinkSync(testPath)
    }
  })

  it('should handle INPUT_TOKENS and OUTPUT_TOKENS separately', () => {
    const env = {
      ...process.env,
      MODEL: 'haiku',
      INPUT_TOKENS: '100',
      OUTPUT_TOKENS: '200',
      TOOL_NAME: 'grep',
      TOKEN_STORAGE_PATH: TEST_STORAGE_PATH,
    }

    execSync('npx tsx src/cli/logTokenUsage.ts', {
      env,
      stdio: 'pipe',
      cwd: path.join(__dirname, '../../..'),
    })

    const data = getAllData()
    const call = Object.values(data.sessions)[0].calls[0]
    expect(call.inputTokens).toBe(100)
    expect(call.outputTokens).toBe(200)
    expect(call.totalTokens).toBe(300)
  })

  it('should handle model names case-insensitively', () => {
    const models = ['HAIKU', 'Sonnet', 'OPUS']

    for (const model of models) {
      const testPath = path.join(process.env.HOME || '', `.claude/token-usage-${model}-test.json`)
      process.env.TOKEN_STORAGE_PATH = testPath

      if (fs.existsSync(testPath)) {
        fs.unlinkSync(testPath)
      }
      initializeStorage()

      const env = {
        ...process.env,
        MODEL: model,
        TOKENS: '100',
        TOOL_NAME: 'read',
        TOKEN_STORAGE_PATH: testPath,
      }

      execSync('npx tsx src/cli/logTokenUsage.ts', {
        env,
        stdio: 'pipe',
        cwd: path.join(__dirname, '../../..'),
      })

      const data = getAllData()
      const call = Object.values(data.sessions)[0].calls[0]
      expect(call.model).toBe(model.toLowerCase())

      fs.unlinkSync(testPath)
    }
  })

  it('should include optional branch name', () => {
    const env = {
      ...process.env,
      MODEL: 'sonnet',
      TOKENS: '500',
      TOOL_NAME: 'commit',
      BRANCH_NAME: 'feature/token-dashboard',
      TOKEN_STORAGE_PATH: TEST_STORAGE_PATH,
    }

    execSync('npx tsx src/cli/logTokenUsage.ts', {
      env,
      stdio: 'pipe',
      cwd: path.join(__dirname, '../../..'),
    })

    const data = getAllData()
    const call = Object.values(data.sessions)[0].calls[0]
    expect(call.branchName).toBe('feature/token-dashboard')
  })

  it('should fail gracefully with missing tokens', () => {
    const env = {
      ...process.env,
      MODEL: 'sonnet',
      TOOL_NAME: 'read',
      TOKEN_STORAGE_PATH: TEST_STORAGE_PATH,
    }

    try {
      execSync('npx tsx src/cli/logTokenUsage.ts', {
        env,
        stdio: 'pipe',
        cwd: path.join(__dirname, '../../..'),
      })
      expect.fail('Should have thrown error')
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})
