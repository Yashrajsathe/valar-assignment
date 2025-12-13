#!/usr/bin/env node

/**
 * SnapFulfil Assignment Starter Template
 * 
 * This file provides a basic structure to get you started.
 * You can use this as a reference or starting point for your implementation.
 */

// Example routing service structure
class RoutingService {
  constructor() {
    // Initialize with dummy SKU data for assignment
    this.f3Skus = ['REFILL-001', 'REFILL-002', 'REFILL-003'];
    this.usSkus = ['US-STARTER-001', 'US-REFILL-001'];
  }

  /**
   * Determine which partner should fulfill an order
   * @param {Object} orderData - Shopify order data
   * @returns {Object} - { partner: string, reason: string }
   */
  async determinePartner(orderData) {
    try {
      // TODO: Implement routing logic
      
      // 1. Check if US order (USD currency + US SKUs)
      if (this.isUSOrder(orderData)) {
        return { partner: 'F-US', reason: 'us_order' };
      }

      // 2. Check if single F3 refill SKU
      if (this.isF3Order(orderData)) {
        return { partner: 'F3', reason: 'refill_sku' };
      }

      // 3. Check if multi-item order
      if (this.isMultiItemOrder(orderData)) {
        return { partner: 'F1', reason: 'multi_item' };
      }

      // 4. Default to F2 for single UK/EU items
      return { partner: 'F2', reason: 'single_item_default' };

    } catch (error) {
      console.error('Routing error:', error);
      return { partner: 'F1', reason: 'error_fallback' };
    }
  }

  isUSOrder(orderData) {
    // TODO: Check if order has USD currency AND contains US SKUs
    return false;
  }

  isF3Order(orderData) {
    // TODO: Check if single item with F3 refill SKU
    return false;
  }

  isMultiItemOrder(orderData) {
    // TODO: Check if order has >1 line item
    return false;
  }
}

// Example queue processor structure
class OrderProcessor {
  constructor(routingService) {
    this.routingService = routingService;
  }

  async processOrder(job) {
    const { orderData } = job.data;
    
    try {
      // Route the order
      const routing = await this.routingService.determinePartner(orderData);
      
      // TODO: Track volume caps
      // TODO: Update metrics
      // TODO: Log routing decision
      
      console.log(`Order ${orderData.order_number} routed to ${routing.partner} (${routing.reason})`);
      
      return routing;
    } catch (error) {
      console.error('Processing error:', error);
      throw error; // Let BullMQ handle retries
    }
  }
}

// Example test structure
describe('RoutingService', () => {
  let routingService;

  beforeEach(() => {
    routingService = new RoutingService();
  });

  test('should route US orders to F-US', async () => {
    const usOrder = {
      presentment_currency: 'USD',
      line_items: [{ sku: 'US-STARTER-001', quantity: 1 }]
    };

    const result = await routingService.determinePartner(usOrder);
    expect(result.partner).toBe('F-US');
    expect(result.reason).toBe('us_order');
  });

  test('should route F3 SKUs to F3', async () => {
    const f3Order = {
      presentment_currency: 'GBP',
      line_items: [{ sku: 'REFILL-001', quantity: 1 }]
    };

    const result = await routingService.determinePartner(f3Order);
    expect(result.partner).toBe('F3');
    expect(result.reason).toBe('refill_sku');
  });

  // TODO: Add more tests for multi-item and default routing
});

// Example Express app structure
const express = require('express');
const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // TODO: Check Redis connectivity
    // TODO: Check queue status
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      redis: 'connected',
      queue: 'operational'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Process order endpoint (for testing)
app.post('/process-order', async (req, res) => {
  try {
    const orderData = req.body;
    
    // TODO: Add to queue or process directly
    
    res.json({
      success: true,
      message: 'Order queued for processing'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Example usage
if (require.main === module) {
  console.log('SnapFulfil Assignment Starter Template');
  console.log('=====================================');
  console.log('');
  console.log('This template provides a basic structure for:');
  console.log('- RoutingService class with routing logic');
  console.log('- OrderProcessor for queue processing');
  console.log('- Basic Express app with health checks');
  console.log('- Example test structure');
  console.log('');
  console.log('To get started:');
  console.log('1. Implement the TODO items in each function');
  console.log('2. Add Redis integration for volume tracking');
  console.log('3. Set up BullMQ for queue processing');
  console.log('4. Write comprehensive tests');
  console.log('');
  console.log('Good luck!');
}

module.exports = {
  RoutingService,
  OrderProcessor
};
