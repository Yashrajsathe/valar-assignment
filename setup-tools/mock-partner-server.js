#!/usr/bin/env node

/**
 * Mock Partner API Server for SnapFulfil Assignment
 * 
 * This server simulates the APIs of fulfillment partners for testing purposes.
 * It provides realistic responses with configurable delays and error rates.
 */

const express = require('express');
const app = express();
const port = process.env.MOCK_SERVER_PORT || 3001;

app.use(express.json());

// Mock partner configurations
const PARTNERS = {
  f1: {
    name: 'F1 Fulfillment',
    baseDelay: 200,
    errorRate: 0.02,
    capacity: 1000
  },
  f2: {
    name: 'F2 Fulfillment',
    baseDelay: 300,
    errorRate: 0.05,
    capacity: 800
  },
  f3: {
    name: 'F3 Fulfillment',
    baseDelay: 400,
    errorRate: 0.08,
    capacity: 600
  },
  f_us: {
    name: 'F-US Fulfillment',
    baseDelay: 100,
    errorRate: 0.01,
    capacity: 500
  }
};

// In-memory storage for orders and tracking
const orders = new Map();
const trackingNumbers = new Map();
let orderCounter = 1000;

// Utility functions
function generateTrackingNumber() {
  return `TRACK${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function getPartnerDelay(partner) {
  const baseDelay = PARTNERS[partner]?.baseDelay || 200;
  const jitter = Math.random() * 100;
  return baseDelay + jitter;
}

function shouldSimulateError(partner) {
  const errorRate = PARTNERS[partner]?.errorRate || 0.05;
  return Math.random() < errorRate;
}

function generateOrderId() {
  return `ORD-${++orderCounter}`;
}

// Middleware for partner authentication
function authenticatePartner(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing API key',
      code: 'UNAUTHORIZED'
    });
  }

  // Simple API key validation (in real world, this would be more secure)
  const partner = req.params.partner;
  if (!PARTNERS[partner]) {
    return res.status(404).json({
      error: 'Partner not found',
      code: 'PARTNER_NOT_FOUND'
    });
  }

  req.partner = partner;
  next();
}

// Generic error simulation middleware
function simulateErrors(req, res, next) {
  if (shouldSimulateError(req.partner)) {
    const errorTypes = [
      { status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 503, code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' },
      { status: 429, code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      { status: 400, code: 'INVALID_REQUEST', message: 'Invalid request format' }
    ];
    
    const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    return res.status(error.status).json({
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
  next();
}

// Delay simulation middleware
function simulateDelay(req, res, next) {
  const delay = getPartnerDelay(req.partner);
  setTimeout(next, delay);
}

// Routes for each partner

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    partners: Object.keys(PARTNERS)
  });
});

// Partner-specific health checks
app.get('/:partner/health', authenticatePartner, (req, res) => {
  const partner = PARTNERS[req.partner];
  res.json({
    status: 'healthy',
    partner: req.partner,
    name: partner.name,
    capacity: partner.capacity,
    timestamp: new Date().toISOString()
  });
});

// Submit order to partner
app.post('/:partner/orders', authenticatePartner, simulateErrors, simulateDelay, (req, res) => {
  const { partner } = req;
  const orderData = req.body;

  // Validate required fields
  if (!orderData.order_number || !orderData.line_items || !orderData.shipping_address) {
    return res.status(400).json({
      error: 'Missing required fields',
      code: 'VALIDATION_ERROR',
      required: ['order_number', 'line_items', 'shipping_address']
    });
  }

  // Generate partner order ID and tracking number
  const partnerOrderId = generateOrderId();
  const trackingNumber = generateTrackingNumber();

  // Store order
  const order = {
    id: partnerOrderId,
    shopify_order_number: orderData.order_number,
    partner: partner,
    status: 'received',
    tracking_number: trackingNumber,
    line_items: orderData.line_items,
    shipping_address: orderData.shipping_address,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  orders.set(partnerOrderId, order);
  trackingNumbers.set(trackingNumber, partnerOrderId);

  // Simulate processing delay
  setTimeout(() => {
    order.status = 'processing';
    order.updated_at = new Date().toISOString();
  }, 5000);

  // Simulate fulfillment after random delay
  setTimeout(() => {
    order.status = 'fulfilled';
    order.fulfilled_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();
  }, Math.random() * 30000 + 10000);

  res.status(201).json({
    success: true,
    order_id: partnerOrderId,
    tracking_number: trackingNumber,
    status: 'received',
    estimated_fulfillment: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    message: `Order received by ${PARTNERS[partner].name}`
  });
});

// Get order status
app.get('/:partner/orders/:orderId', authenticatePartner, simulateErrors, (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({
      error: 'Order not found',
      code: 'ORDER_NOT_FOUND'
    });
  }

  res.json({
    success: true,
    order: order
  });
});

// Track by tracking number
app.get('/:partner/tracking/:trackingNumber', authenticatePartner, (req, res) => {
  const { trackingNumber } = req.params;
  const orderId = trackingNumbers.get(trackingNumber);

  if (!orderId) {
    return res.status(404).json({
      error: 'Tracking number not found',
      code: 'TRACKING_NOT_FOUND'
    });
  }

  const order = orders.get(orderId);
  res.json({
    success: true,
    tracking_number: trackingNumber,
    status: order.status,
    order_id: orderId,
    events: [
      {
        status: 'received',
        timestamp: order.created_at,
        description: 'Order received by fulfillment center'
      },
      {
        status: order.status,
        timestamp: order.updated_at,
        description: `Order ${order.status}`
      }
    ]
  });
});

// Cancel order
app.delete('/:partner/orders/:orderId', authenticatePartner, simulateErrors, (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({
      error: 'Order not found',
      code: 'ORDER_NOT_FOUND'
    });
  }

  if (order.status === 'fulfilled') {
    return res.status(400).json({
      error: 'Cannot cancel fulfilled order',
      code: 'CANNOT_CANCEL'
    });
  }

  order.status = 'cancelled';
  order.cancelled_at = new Date().toISOString();
  order.updated_at = new Date().toISOString();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    order_id: orderId
  });
});

// Get partner capacity
app.get('/:partner/capacity', authenticatePartner, (req, res) => {
  const partner = PARTNERS[req.partner];
  const currentOrders = Array.from(orders.values())
    .filter(order => order.partner === req.partner && order.status !== 'fulfilled' && order.status !== 'cancelled')
    .length;

  res.json({
    success: true,
    partner: req.partner,
    total_capacity: partner.capacity,
    current_orders: currentOrders,
    available_capacity: partner.capacity - currentOrders,
    utilization: (currentOrders / partner.capacity * 100).toFixed(2) + '%'
  });
});

// Webhook simulation endpoint (for testing webhook handling)
app.post('/:partner/webhook/test', authenticatePartner, (req, res) => {
  const { order_id, status } = req.body;
  
  // This would normally send a webhook to the main application
  console.log(`[WEBHOOK SIMULATION] Partner: ${req.partner}, Order: ${order_id}, Status: ${status}`);
  
  res.json({
    success: true,
    message: 'Webhook simulation triggered',
    webhook_url: process.env.WEBHOOK_URL || 'http://localhost:3000/webhook/partner-update'
  });
});

// List all orders for a partner (for debugging)
app.get('/:partner/orders', authenticatePartner, (req, res) => {
  const partnerOrders = Array.from(orders.values())
    .filter(order => order.partner === req.partner);

  res.json({
    success: true,
    partner: req.partner,
    total_orders: partnerOrders.length,
    orders: partnerOrders
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Mock server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    available_endpoints: [
      'GET /health',
      'GET /:partner/health',
      'POST /:partner/orders',
      'GET /:partner/orders/:orderId',
      'GET /:partner/tracking/:trackingNumber',
      'DELETE /:partner/orders/:orderId',
      'GET /:partner/capacity'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Mock Partner API Server running on port ${port}`);
  console.log(`📋 Available partners: ${Object.keys(PARTNERS).join(', ')}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log('\n📖 API Usage:');
  console.log('  - Set X-API-Key header for authentication');
  console.log('  - Use partner name in URL path (f1, f2, f3, f_us)');
  console.log('  - Example: POST http://localhost:3001/f1/orders');
  console.log('\n⚙️  Configuration:');
  Object.entries(PARTNERS).forEach(([key, partner]) => {
    console.log(`  - ${key}: ${partner.name} (${partner.errorRate * 100}% error rate, ${partner.baseDelay}ms delay)`);
  });
});

module.exports = app;
