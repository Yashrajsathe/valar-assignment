const RedisServer = require('redis-server');
const path = require('path');

// Configuration
const port = process.env.REDIS_PORT || 6379;
const host = process.env.REDIS_HOST || '127.0.0.1';

// Create and start Redis server
const server = new RedisServer({
  port,
  host,
  replicas: [],
  closeTimeout: 5000,
  databases: 16
});

console.log(`⏳ Starting Redis server on ${host}:${port}...`);

server.open((err) => {
  if (err) {
    console.error(`❌ Redis Error: ${err.message}`);
    process.exit(1);
  }

  console.log(`✅ Redis server is running on ${host}:${port}`);
  console.log(`\n📋 To run the application in another terminal:\n   npm start\n   OR\n   npm run worker\n`);
  console.log('Press Ctrl+C to stop Redis server');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Redis server...');
  server.close(() => {
    console.log('✅ Redis server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
