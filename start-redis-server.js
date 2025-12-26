const redis = require('redis-server');
const { spawn } = require('child_process');
const path = require('path');

// Start Redis server
const server = new redis.Server({
  port: 6379,
  host: '127.0.0.1',
  dbfilename: 'dump.rdb',
  dir: __dirname
});

server.open((err) => {
  if (err) {
    console.error('Failed to start Redis:', err);
    process.exit(1);
  }
  
  console.log('✅ Redis server started on 127.0.0.1:6379');
  
  // Start the application
  setTimeout(() => {
    const app = spawn('node', ['src/server.js'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    app.on('error', (err) => {
      console.error('Failed to start app:', err);
      process.exit(1);
    });
  }, 1000);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => {
    console.log('Redis server closed');
    process.exit(0);
  });
});
