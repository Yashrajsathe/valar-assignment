/**
 * Redis Client Utility for SnapFulfil Assignment
 *
 * Provides Redis connection management with connection pooling and error handling.
 */

const IORedis = require('ioredis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;

    // Configuration
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Connection pooling
      connectionName: 'snapfulfil-assignment',
      keepAlive: 30000,
      // Pool settings
      min: parseInt(process.env.REDIS_POOL_MIN) || 2,
      max: parseInt(process.env.REDIS_POOL_MAX) || 10
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.client = new IORedis(this.config);

      // Connection event handlers
      this.client.on('connect', () => {
        console.log('🔗 Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready');
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();
      console.log('✅ Redis connection established successfully');

    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('✅ Redis disconnected');
    }
  }

  /**
   * Get Redis client instance
   * @returns {IORedis} - Redis client
   */
  getClient() {
    return this.client;
  }

  /**
   * Check if Redis is connected
   * @returns {boolean}
   */
  isHealthy() {
    return this.isConnected && this.client && this.client.status === 'ready';
  }

  /**
   * Execute Redis operation with timeout
   * @param {Function} operation - Operation to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {*} - Operation result
   */
  async withTimeout(operation, timeout = 5000) {
    if (!this.isHealthy()) {
      throw new Error('Redis client not connected');
    }

    return Promise.race([
      operation(this.client),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis operation timeout')), timeout)
      )
    ]);
  }

  /**
   * Get value with timeout
   * @param {string} key - Redis key
   * @returns {string|null}
   */
  async get(key) {
    return this.withTimeout(async (client) => await client.get(key));
  }

  /**
   * Set value with timeout
   * @param {string} key - Redis key
   * @param {string} value - Value to set
   * @param {string} expiry - Expiry mode (EX, PX, etc.)
   * @param {number} time - Expiry time
   * @returns {string}
   */
  async set(key, value, expiry, time) {
    return this.withTimeout(async (client) => {
      if (expiry && time) {
        return await client.set(key, value, expiry, time);
      }
      return await client.set(key, value);
    });
  }

  /**
   * Increment value with timeout
   * @param {string} key - Redis key
   * @returns {number}
   */
  async incr(key) {
    return this.withTimeout(async (client) => await client.incr(key));
  }

  /**
   * Delete key with timeout
   * @param {string} key - Redis key
   * @returns {number}
   */
  async del(key) {
    return this.withTimeout(async (client) => await client.del(key));
  }

  /**
   * Get all keys matching pattern with timeout
   * @param {string} pattern - Key pattern
   * @returns {string[]}
   */
  async keys(pattern) {
    return this.withTimeout(async (client) => await client.keys(pattern));
  }

  /**
   * Execute multiple commands in transaction with timeout
   * @param {Array} commands - Array of commands
   * @returns {Array}
   */
  async multi(commands) {
    return this.withTimeout(async (client) => {
      const multi = client.multi();
      commands.forEach(cmd => multi[cmd[0]](...cmd.slice(1)));
      return await multi.exec();
    });
  }

  /**
   * Get Redis info
   * @returns {Object}
   */
  async getInfo() {
    try {
      const info = await this.withTimeout(async (client) => await client.info());
      return this.parseInfo(info);
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Parse Redis INFO command output
   * @param {string} info - Raw INFO output
   * @returns {Object}
   */
  parseInfo(info) {
    const lines = info.split('\r\n');
    const result = {};

    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });

    return result;
  }

  /**
   * Get memory usage statistics
   * @returns {Object}
   */
  async getMemoryStats() {
    try {
      const info = await this.getInfo();
      return {
        used_memory: info.used_memory,
        used_memory_human: info.used_memory_human,
        used_memory_peak: info.used_memory_peak,
        used_memory_peak_human: info.used_memory_peak_human,
        mem_fragmentation_ratio: info.mem_fragmentation_ratio
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = {
  RedisClient
};
