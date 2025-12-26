// Simple Redis mock server for development/testing
const net = require('net');
const { spawn } = require('child_process');
const path = require('path');

// In-memory data store
const store = {};
const queues = {};

// Simple Redis protocol parser
class RedisProtocol {
  static parse(data) {
    const str = data.toString();
    const lines = str.trim().split('\r\n');
    const args = [];
    let i = 0;
    
    while (i < lines.length) {
      if (lines[i].startsWith('*')) {
        const argCount = parseInt(lines[i].substring(1));
        i++;
        for (let j = 0; j < argCount; j++) {
          if (lines[i].startsWith('$')) {
            i++;
            args.push(lines[i]);
            i++;
          }
        }
      } else {
        i++;
      }
    }
    return args;
  }

  static encode(data) {
    if (Array.isArray(data)) {
      let result = `*${data.length}\r\n`;
      for (const item of data) {
        const str = String(item);
        result += `$${str.length}\r\n${str}\r\n`;
      }
      return result;
    } else {
      const str = String(data);
      return `$${str.length}\r\n${str}\r\n`;
    }
  }
}

// Simple Redis command handler
function handleCommand(args) {
  if (args.length === 0) return '+OK\r\n';
  
  const cmd = args[0].toUpperCase();
  const key = args[1];
  
  switch (cmd) {
    case 'SET':
      store[key] = args[2];
      return '+OK\r\n';
    case 'GET':
      return store[key] ? `$${String(store[key]).length}\r\n${store[key]}\r\n` : '$-1\r\n';
    case 'DEL':
      delete store[key];
      return ':1\r\n';
    case 'EXISTS':
      return key in store ? ':1\r\n' : ':0\r\n';
    case 'PING':
      return '+PONG\r\n';
    case 'ECHO':
      return RedisProtocol.encode(args[1]);
    case 'QUIT':
      return '+OK\r\n';
    case 'LPUSH':
      if (!queues[key]) queues[key] = [];
      queues[key].push(...args.slice(2));
      return `:${queues[key].length}\r\n`;
    case 'LPOP':
      if (!queues[key] || queues[key].length === 0) return '$-1\r\n';
      const item = queues[key].shift();
      return RedisProtocol.encode(item);
    case 'LRANGE':
      if (!queues[key]) return '*0\r\n';
      const start = parseInt(args[2]) || 0;
      const stop = parseInt(args[3]) || -1;
      const list = queues[key].slice(start, stop + 1);
      return `*${list.length}\r\n` + list.map(i => `$${String(i).length}\r\n${i}\r\n`).join('');
    case 'COMMAND':
      return '*0\r\n';
    case 'INFO':
      const info = 'redis_version:7.0.0\r\nredis_mode:standalone\r\nos:Windows\r\n';
      return `$${info.length}\r\n${info}\r\n`;
    case 'FLUSHDB':
      for (const k in store) delete store[k];
      for (const k in queues) delete queues[k];
      return '+OK\r\n';
    case 'DBSIZE':
      return `:${Object.keys(store).length}\r\n`;
    default:
      return `-ERR unknown command '${cmd}'\r\n`;
  }
}

// Create TCP server
const server = net.createServer((socket) => {
  console.log('✅ Client connected');
  
  let buffer = '';
  
  socket.on('data', (data) => {
    buffer += data.toString();
    
    // Process commands
    const lines = buffer.split('\r\n');
    buffer = lines.pop(); // Keep incomplete line in buffer
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i].startsWith('*')) {
        const argCount = parseInt(lines[i].substring(1));
        const args = [];
        for (let j = 0; j < argCount; j++) {
          i += 2;
          if (i < lines.length) {
            args.push(lines[i]);
          }
        }
        const response = handleCommand(args);
        socket.write(response);
      }
    }
  });
  
  socket.on('end', () => {
    console.log('👋 Client disconnected');
  });
  
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

const port = process.env.REDIS_PORT || 6379;
const host = process.env.REDIS_HOST || '127.0.0.1';

server.listen(port, host, () => {
  console.log(`\n✅ Redis Mock Server running on ${host}:${port}`);
  console.log(`\n📋 To run the application in another terminal:\n   npm start\n   OR\n   npm run worker\n`);
  console.log('Press Ctrl+C to stop\n');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Redis Mock Server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
