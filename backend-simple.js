const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Mock data
const tokenData = {
  status: 'ok',
  data: {
    totalTokens: 4500,
    totalCost: "0.0403",
    callCount: 5,
    usagePercent: 10.2,
    modelBreakdown: {
      haiku: { calls: 2, tokens: 1200, percent: 26.7 },
      sonnet: { calls: 3, tokens: 3300, percent: 73.3 }
    },
    limits: { session: 44000, weekly: 800000 },
    alert: { level: 'ok', message: 'You\'re at 10% of your session budget. Keep working; no restrictions yet.' }
  },
  thresholds: { warning: 65, critical: 90 },
  alerts: [{ level: 'ok', message: 'Session budget healthy' }]
};

const recommendations = {
  data: [
    {
      id: 'rec-1',
      type: 'model-switch',
      title: 'Switch to Haiku',
      description: 'Haiku is more efficient for your typical tasks',
      confidence: 87,
      potentialSavings: 400,
      model: 'haiku'
    }
  ]
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running', storage: 'accessible' });
});

app.get('/api/session/current', (req, res) => {
  res.json(tokenData);
});

app.get('/api/recommendations', (req, res) => {
  res.json(recommendations);
});

const PORT = 4201;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
