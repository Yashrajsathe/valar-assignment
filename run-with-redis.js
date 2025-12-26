#!/usr/bin/env node

require('dotenv').config();
const { spawn } = require('child_process');
const http = require('http');

// Try to connect to Redis to see if it's running
function checkRedis() {
  return new Promise((resolve) => {
    const req = http.get(`http://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`, 
      { timeout: 1000 },
      () => resolve(true)
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start the app
async function startApp() {
  console.log('🚀 Starting SnapFulfil Routing Service...');
  
  const app = spawn('node', ['src/sever.js'], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  app.on('error', (err) => {
    console.error('❌ Failed to start application:', err.message);
    process.exit(1);
  });

  app.on('close', (code) => {
    console.log(`Application exited with code ${code}`);
    process.exit(code);
  });
}

startApp();
