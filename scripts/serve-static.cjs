#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 4202);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.join(__dirname, '..', 'packages', 'frontend', 'public');

const rewrites = new Map([
  ['/api/health', '/api/health.json'],
  ['/api/session/current', '/api/session/current.json'],
  ['/api/recommendations', '/api/recommendations.json'],
]);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function resolveRequestPath(urlPath) {
  const rewritten = rewrites.get(urlPath) || urlPath;
  const normalized = rewritten === '/' ? '/index.html' : rewritten;
  return path.join(ROOT, normalized);
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (req.method === 'OPTIONS') {
    send(res, 204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return;
  }

  const filePath = resolveRequestPath(urlPath);
  const relative = path.relative(ROOT, filePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, 'index.html'), (fallbackErr, fallbackData) => {
        if (fallbackErr) {
          send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
          return;
        }

        send(res, 200, { 'Content-Type': 'text/html; charset=utf-8' }, fallbackData);
      });
      return;
    }

    const ext = path.extname(filePath);
    const headers = {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    };

    if (urlPath.startsWith('/api/')) {
      headers['Access-Control-Allow-Origin'] = '*';
      headers['Cache-Control'] = 'no-store';
    }

    send(res, 200, headers, data);
  });
});

server.on('error', (err) => {
  console.error(`Failed to start preview server on ${HOST}:${PORT}`);
  console.error(err.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Token Usage Dashboard ready at http://localhost:${PORT}`);
  console.log(`API health: http://localhost:${PORT}/api/health`);
});
