const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: false,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3
});

redis.on('error', (err) => {
  logger.warn(`Redis connection error: ${err.message}`);
});

redis.on('connect', () => {
  logger.info('✓ Connected to Redis');
});

module.exports = redis;
