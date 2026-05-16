const express = require('express');
const cors = require('cors');

console.log('[BACKEND] Starting server...');

const app = express();
app.use(cors());
app.use(express.json());

const data = {
  status: 'ok',
  data: {
    totalTokens: 4500,
    usagePercent: 10.2,
    modelBreakdown: { haiku: { tokens: 1200 }, sonnet: { tokens: 3300 } },
    alert: { level: 'ok', message: 'Session budget healthy' }
  }
};

app.get('/api/health', (req, res) => {
  console.log('[BACKEND] Health check requested');
  res.json({ status: 'ok', message: 'Backend running' });
});

app.get('/api/session/current', (req, res) => {
  console.log('[BACKEND] Session data requested');
  res.json(data);
});

app.get('/api/recommendations', (req, res) => {
  console.log('[BACKEND] Recommendations requested');
  res.json({ data: [{ type: 'model-switch', confidence: 87 }] });
});

const PORT = 4201;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('[BACKEND] ✅ Server listening on 0.0.0.0:' + PORT);
  console.log('[BACKEND] API available at http://localhost:' + PORT);
});

server.on('error', (err) => {
  console.error('[BACKEND] ERROR:', err);
  process.exit(1);
});
