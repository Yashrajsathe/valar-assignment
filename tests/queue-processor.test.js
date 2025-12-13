/**
 * Unit Tests for Queue Processor
 *
 * Tests queue processing, job handling, error retry logic, and monitoring.
 */

const { QueueProcessor } = require('../src/queue-processor');
const { RoutingService } = require('../src/routing-service');

// Mock BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    getJobs: jest.fn(),
    getJob: jest.fn(),
    close: jest.fn()
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn()
  }))
}));

// Mock Redis client
const mockRedis = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  isHealthy: jest.fn().mockReturnValue(true)
};

describe('QueueProcessor', () => {
  let routingService;
  let queueProcessor;

  beforeEach(() => {
    routingService = new RoutingService();
    routingService.setRedisClient(mockRedis);
    queueProcessor = new QueueProcessor(routingService);
  });

  afterEach(async () => {
    await queueProcessor.close();
  });

  describe('Initialization', () => {
    test('should initialize with routing service', () => {
      expect(queueProcessor.routingService).toBe(routingService);
    });

    test('should initialize queue and worker', async () => {
      await queueProcessor.initialize();
      expect(queueProcessor.queue).toBeDefined();
      expect(queueProcessor.worker).toBeDefined();
    });

    test('should handle Redis connection errors', async () => {
      mockRedis.connect.mockRejectedValue(new Error('Redis connection failed'));

      await expect(queueProcessor.initialize()).rejects.toThrow('Redis connection failed');
    });
  });

  describe('Order Processing', () => {
    beforeEach(async () => {
      await queueProcessor.initialize();
    });

    test('should add order to queue', async () => {
      const orderData = {
        order_number: 'TEST-001',
        line_items: [{ sku: 'STARTER-001', quantity: 1 }]
      };

      const result = await queueProcessor.addOrder(orderData);

      expect(result).toHaveProperty('jobId');
      expect(queueProcessor.queue.add).toHaveBeenCalledWith(
        'process-order',
        { orderData },
        expect.any(Object)
      );
    });

    test('should process order successfully', async () => {
      const mockJob = {
        id: 'job-123',
        data: {
          orderData: {
            order_number: 'TEST-001',
            line_items: [{ sku: 'STARTER-001', quantity: 1 }]
          }
        }
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await queueProcessor.processOrder(mockJob);

      expect(result).toHaveProperty('partner');
      expect(result).toHaveProperty('reason');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Order TEST-001 routed to')
      );

      consoleSpy.mockRestore();
    });

    test('should handle processing errors', async () => {
      const mockJob = {
        id: 'job-123',
        data: {
          orderData: null // Invalid order data
        }
      };

      await expect(queueProcessor.processOrder(mockJob)).rejects.toThrow();
    });

    test('should handle volume capacity fallback', async () => {
      // Mock routing service to return F2, but F2 is at capacity
      const originalDeterminePartner = routingService.determinePartner;
      routingService.determinePartner = jest.fn().mockResolvedValue({ partner: 'F2', reason: 'single_item' });
      routingService.isAtCapacity = jest.fn().mockResolvedValue(true);

      const mockJob = {
        id: 'job-123',
        data: {
          orderData: {
            order_number: 'TEST-001',
            line_items: [{ sku: 'STARTER-001', quantity: 1 }]
          }
        }
      };

      const result = await queueProcessor.processOrder(mockJob);

      expect(result.partner).toBe('F1'); // Should fallback to F1
      expect(result.reason).toBe('capacity_fallback');

      // Restore original method
      routingService.determinePartner = originalDeterminePartner;
    });
  });

  describe('Queue Statistics', () => {
    beforeEach(async () => {
      await queueProcessor.initialize();
    });

    test('should get queue statistics', async () => {
      const mockJobs = {
        waiting: [],
        active: [],
        completed: [],
        failed: [],
        delayed: []
      };

      queueProcessor.queue.getJobs.mockResolvedValue(mockJobs);

      const stats = await queueProcessor.getQueueStats();

      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('total');
    });

    test('should handle queue stats errors', async () => {
      queueProcessor.queue.getJobs.mockRejectedValue(new Error('Queue error'));

      const stats = await queueProcessor.getQueueStats();

      expect(stats).toHaveProperty('error');
      expect(stats.error).toBe('Queue error');
    });
  });

  describe('Job Details', () => {
    beforeEach(async () => {
      await queueProcessor.initialize();
    });

    test('should get job details', async () => {
      const mockJob = {
        id: 'job-123',
        data: { orderData: { order_number: 'TEST-001' } },
        opts: { attempts: 3 },
        attemptsMade: 1,
        finishedOn: Date.now(),
        processedOn: Date.now(),
        failedReason: null
      };

      queueProcessor.queue.getJob.mockResolvedValue(mockJob);

      const details = await queueProcessor.getJobDetails('job-123');

      expect(details).toHaveProperty('id', 'job-123');
      expect(details).toHaveProperty('status');
      expect(details).toHaveProperty('order_number', 'TEST-001');
    });

    test('should handle job not found', async () => {
      queueProcessor.queue.getJob.mockResolvedValue(null);

      const details = await queueProcessor.getJobDetails('non-existent');

      expect(details).toHaveProperty('error', 'Job not found');
    });

    test('should handle job retrieval errors', async () => {
      queueProcessor.queue.getJob.mockRejectedValue(new Error('Job error'));

      const details = await queueProcessor.getJobDetails('job-123');

      expect(details).toHaveProperty('error', 'Job error');
    });
  });

  describe('Worker Event Handling', () => {
    beforeEach(async () => {
      await queueProcessor.initialize();
    });

    test('should log completed jobs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Simulate worker 'completed' event
      const completedHandler = queueProcessor.worker.on.mock.calls.find(
        call => call[0] === 'completed'
      )[1];

      const mockJob = {
        id: 'job-123',
        data: { orderData: { order_number: 'TEST-001' } },
        returnvalue: { partner: 'F2', reason: 'single_item' }
      };

      completedHandler(mockJob);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job job-123 completed')
      );

      consoleSpy.mockRestore();
    });

    test('should log failed jobs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate worker 'failed' event
      const failedHandler = queueProcessor.worker.on.mock.calls.find(
        call => call[0] === 'failed'
      )[1];

      const mockJob = {
        id: 'job-123',
        data: { orderData: { order_number: 'TEST-001' } }
      };
      const error = new Error('Processing failed');

      failedHandler(mockJob, error);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job job-123 failed')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    test('should close queue and worker', async () => {
      await queueProcessor.initialize();
      await queueProcessor.close();

      expect(queueProcessor.queue.close).toHaveBeenCalled();
      expect(queueProcessor.worker.close).toHaveBeenCalled();
    });

    test('should handle close errors gracefully', async () => {
      await queueProcessor.initialize();
      queueProcessor.queue.close.mockRejectedValue(new Error('Close error'));

      // Should not throw
      await expect(queueProcessor.close()).resolves.not.toThrow();
    });
  });
});
