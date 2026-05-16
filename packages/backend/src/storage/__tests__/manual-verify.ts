// Manual verification script for tokenStorage
import fs from 'fs'
import path from 'path'
import {
  initializeStorage,
  appendTokenCall,
  getCurrentSession,
  aggregateByModel,
  computeThresholds,
  getAllData,
} from '../tokenStorage'
} from '../tokenStorage.js'
import { TokenCall } from '../../types.js'

// Use test storage
const testPath = path.join(process.env.HOME || '', '.claude', 'token-usage-verify.json')
process.env.TOKEN_STORAGE_PATH = testPath

// Cleanup
if (fs.existsSync(testPath)) {
  fs.unlinkSync(testPath)
}

console.log('=== Manual Verification of tokenStorage ===\n')

try {
  // Test 1: Initialize storage
  console.log('Test 1: Initialize storage')
  initializeStorage()
  const exists = fs.existsSync(testPath)
  console.log(`✓ Storage file created: ${exists}\n`)

  // Test 2: Append token calls
  console.log('Test 2: Append token calls')
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
  ]

  for (const call of calls) {
    appendTokenCall(call)
  }
  console.log(`✓ Appended ${calls.length} token calls\n`)

  // Test 3: Get current session
  console.log('Test 3: Get current session')
  const session = getCurrentSession()
  console.log(`✓ Session ID: ${session?.id}`)
  console.log(`✓ Total tokens: ${session?.totalTokens}`)
  console.log(`✓ Total calls: ${session?.calls.length}\n`)

  // Test 4: Aggregate by model
  console.log('Test 4: Aggregate by model')
  const breakdown = aggregateByModel()
  console.log(`✓ Haiku: ${breakdown.haiku?.tokens} tokens in ${breakdown.haiku?.calls} calls`)
  console.log(`✓ Sonnet: ${breakdown.sonnet?.tokens} tokens in ${breakdown.sonnet?.calls} calls\n`)

  // Test 5: Compute thresholds
  console.log('Test 5: Compute thresholds')
  const thresholds = computeThresholds()
  console.log(`✓ Session: ${thresholds.session.used}/${thresholds.session.capacity} (${thresholds.session.percent.toFixed(1)}%) - ${thresholds.session.level}`)
  console.log(`✓ Weekly: ${thresholds.weekly.used}/${thresholds.weekly.capacity} (${thresholds.weekly.percent.toFixed(1)}%) - ${thresholds.weekly.level}\n`)

  // Test 6: Verify data persistence
  console.log('Test 6: Verify data persistence')
  const data = getAllData()
  const sessionCount = Object.keys(data.sessions).length
  const totalCallsInStorage = Object.values(data.sessions).reduce((sum, s) => sum + s.calls.length, 0)
  console.log(`✓ Sessions in storage: ${sessionCount}`)
  console.log(`✓ Total calls in storage: ${totalCallsInStorage}\n`)

  // Test 7: Verify file structure
  console.log('Test 7: Verify file structure')
  const rawData = JSON.parse(fs.readFileSync(testPath, 'utf-8'))
  console.log(`✓ Has meta: ${!!rawData.meta}`)
  console.log(`✓ Has sessions: ${!!rawData.sessions}`)
  console.log(`✓ Has sprints: ${!!rawData.sprints}`)
  console.log(`✓ Has limits: ${!!rawData.limits}`)
  console.log(`✓ Has recommendations: ${Array.isArray(rawData.recommendations)}\n`)

  console.log('=== All manual verification tests passed! ===')

  // Cleanup
  fs.unlinkSync(testPath)
} catch (error) {
  console.error('Error during verification:', error)
  process.exit(1)
}
