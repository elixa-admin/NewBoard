#!/bin/bash
set -e
cd "$(dirname "$0")"
node_modules/.bin/esbuild packages/backend/src/server.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile=/tmp/newboard-server.js \
  --log-level=silent
node /tmp/newboard-server.js
