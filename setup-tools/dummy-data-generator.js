#!/usr/bin/env node

/**
 * Dummy Data Generator for SnapFulfil Assignment
 * 
 * This script generates test data for the assignment including:
 * - Mock Shopify orders
 * - Test fulfillment partners
 * - Sample SKU configurations
 * - Performance test data
 */

const fs = require('fs');
const path = require('path');

// Dummy SKUs for assignment (completely fictional)
const SAMPLE_SKUS = {
  // F3 refill SKUs (single item, quantity 1 only)
  'REFILL-001': { volume: 0.00111, weight: 0.1, category: 'refill', partner: 'f3' },
  'REFILL-002': { volume: 0.00111, weight: 0.1, category: 'refill', partner: 'f3' },
  'REFILL-003': { volume: 0.00111, weight: 0.1, category: 'refill', partner: 'f3' },
  
  // Small volume items (typical concentrates)
  'CONC-001': { volume: 0.0004, weight: 0.05, category: 'concentrate', partner: 'f1_f2' },
  'CONC-002': { volume: 0.0009, weight: 0.08, category: 'concentrate', partner: 'f1_f2' },
  'CLOTH-001': { volume: 0.00111, weight: 0.1, category: 'cloth', partner: 'f1_f2' },
  'TRIGGER-001': { volume: 0.005, weight: 0.3, category: 'trigger', partner: 'f1_f2' },
  
  // Medium volume items (starter kits)
  'STARTER-001': { volume: 0.011, weight: 0.8, category: 'starter_kit', partner: 'f1_f2' },
  'STARTER-002': { volume: 0.011, weight: 0.8, category: 'starter_kit', partner: 'f1' },
  'STARTER-003': { volume: 0.011, weight: 0.8, category: 'starter_kit', partner: 'f1' },
  
  // Large volume items
  'LARGE-KIT-001': { volume: 0.026, weight: 2.0, category: 'large_kit', partner: 'f1' },
  
  // US SKUs (route to F-US)
  'US-STARTER-001': { volume: 0.011, weight: 0.8, category: 'us_starter_kit', partner: 'f_us' },
  'US-REFILL-001': { volume: 0.00111, weight: 0.1, category: 'us_refill', partner: 'f_us' },
  
  // Combo SKUs (for testing SKU combinations)
  'COMBO-001': { volume: 0.005, weight: 0.3, category: 'combo_item', partner: 'f1_f2' },
  'COMBO-002': { volume: 0.005, weight: 0.3, category: 'combo_item', partner: 'f1_f2' }
};

// Mock fulfillment partners (completely fictional for assignment)
const TEST_PARTNERS = {
  f1: {
    name: 'F1 Fulfillment',
    description: 'Primary UK/EU fulfillment partner (MOCK)',
    capabilities: ['multi_item', 'address_validation', 'auto_manual'],
    regions: ['UK', 'EU'],
    maxVolume: 'unlimited',
    costPerShipment: 4.50,
    avgFulfillmentTime: 24,
    successRate: 0.98,
    apiEndpoint: 'http://localhost:3001/mock-f1',
    supportedSKUs: Object.keys(SAMPLE_SKUS).filter(sku => 
      SAMPLE_SKUS[sku].partner === 'f1' || SAMPLE_SKUS[sku].partner === 'f1_f2'
    ),
    queueTag: 'F1 Queue',
    fulfillmentTag: 'F1'
  },
  f2: {
    name: 'F2 Fulfillment',
    description: 'UK/EU single-item and specific SKU combinations (MOCK)',
    capabilities: ['single_item', 'box_calculation', 'default_routing'],
    regions: ['UK', 'EU'],
    maxVolume: 'varies_by_sku',
    costPerShipment: 3.75,
    avgFulfillmentTime: 18,
    successRate: 0.96,
    apiEndpoint: 'http://localhost:3001/mock-f2',
    supportedSKUs: Object.keys(SAMPLE_SKUS).filter(sku => 
      SAMPLE_SKUS[sku].partner === 'f1_f2'
    ),
    queueTag: 'F2 Queue',
    fulfillmentTag: 'F2'
  },
  f3: {
    name: 'F3 Fulfillment',
    description: 'UK/EU refill SKUs only (MOCK)',
    capabilities: ['refill_only', 'single_quantity'],
    regions: ['UK', 'EU'],
    maxVolume: 'unlimited',
    costPerShipment: 2.25,
    avgFulfillmentTime: 12,
    successRate: 0.99,
    apiEndpoint: 'http://localhost:3001/mock-f3',
    supportedSKUs: ['REFILL-001', 'REFILL-002', 'REFILL-003'],
    queueTag: 'F3 Queue',
    fulfillmentTag: 'F3'
  },
  f_us: {
    name: 'F-US Fulfillment',
    description: 'US fulfillment partner (MOCK)',
    capabilities: ['us_orders', 'usd_currency', 'sku_mapping'],
    regions: ['US'],
    maxVolume: 'unlimited',
    costPerShipment: 6.50,
    avgFulfillmentTime: 36,
    successRate: 0.94,
    apiEndpoint: 'http://localhost:3001/mock-f-us',
    supportedSKUs: Object.keys(SAMPLE_SKUS).filter(sku => 
      SAMPLE_SKUS[sku].partner === 'f_us'
    ),
    queueTag: 'F-US Queue',
    fulfillmentTag: 'F-US'
  }
};

// Generate mock Shopify orders
function generateMockOrders(count = 100) {
  const orders = [];
  const customerEmails = [
    'john.doe@gmail.com',
    'jane.smith@yahoo.com',
    'bob.johnson@hotmail.com',
    'alice.brown@company.com',
    'charlie.wilson@startup.io'
  ];
  
  const shippingAddresses = [
    { country: 'US', state: 'CA', city: 'Los Angeles', zip: '90210' },
    { country: 'US', state: 'NY', city: 'New York', zip: '10001' },
    { country: 'US', state: 'TX', city: 'Austin', zip: '73301' },
    { country: 'CA', state: 'ON', city: 'Toronto', zip: 'M5V 3A8' },
    { country: 'GB', state: '', city: 'London', zip: 'SW1A 1AA' }
  ];

  for (let i = 1; i <= count; i++) {
    const lineItemCount = Math.floor(Math.random() * 5) + 1;
    const lineItems = [];
    let totalPrice = 0;

    for (let j = 0; j < lineItemCount; j++) {
      const skus = Object.keys(SAMPLE_SKUS);
      const sku = skus[Math.floor(Math.random() * skus.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = (Math.random() * 50 + 10).toFixed(2);
      
      lineItems.push({
        id: `line_${i}_${j}`,
        sku: sku,
        quantity: quantity,
        fulfillable_quantity: quantity,
        price: price,
        total_discount: '0.00',
        title: `Test Product ${sku}`,
        variant_id: `variant_${sku}`,
        product_id: `product_${sku.substring(0, 5)}`
      });
      
      totalPrice += parseFloat(price) * quantity;
    }

    const address = shippingAddresses[Math.floor(Math.random() * shippingAddresses.length)];
    const email = customerEmails[Math.floor(Math.random() * customerEmails.length)];

    orders.push({
      id: `order_${i.toString().padStart(6, '0')}`,
      order_number: `TEST-${i.toString().padStart(4, '0')}`,
      email: email,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      financial_status: 'paid',
      fulfillment_status: null,
      total_price: totalPrice.toFixed(2),
      subtotal_price: totalPrice.toFixed(2),
      total_tax: (totalPrice * 0.08).toFixed(2),
      currency: 'USD',
      line_items: lineItems,
      customer: {
        id: `customer_${Math.floor(i / 10) + 1}`,
        email: email,
        first_name: email.split('.')[0],
        last_name: email.split('.')[1]?.split('@')[0] || 'User'
      },
      shipping_address: {
        first_name: email.split('.')[0],
        last_name: email.split('.')[1]?.split('@')[0] || 'User',
        address1: `${Math.floor(Math.random() * 9999) + 1} Test St`,
        city: address.city,
        province: address.state,
        country: address.country,
        zip: address.zip
      },
      tags: Math.random() > 0.7 ? 'express' : '',
      note: `Test order ${i} for assignment`
    });
  }

  return orders;
}

// Generate performance test scenarios
function generateTestScenarios() {
  return {
    load_test_scenarios: [
      {
        name: 'Normal Load',
        description: 'Typical business day traffic',
        orders_per_minute: 50,
        duration_minutes: 10,
        concurrent_users: 5
      },
      {
        name: 'Peak Load',
        description: 'Black Friday / Cyber Monday traffic',
        orders_per_minute: 200,
        duration_minutes: 15,
        concurrent_users: 20
      },
      {
        name: 'Stress Test',
        description: 'Maximum system capacity test',
        orders_per_minute: 500,
        duration_minutes: 5,
        concurrent_users: 50
      }
    ],
    error_scenarios: [
      {
        name: 'Partner API Failure',
        description: 'Primary partner API returns 500 errors',
        failure_rate: 0.3,
        affected_partners: ['linc']
      },
      {
        name: 'Redis Connection Loss',
        description: 'Redis becomes unavailable',
        failure_duration_seconds: 30,
        recovery_time_seconds: 10
      },
      {
        name: 'Queue Backup',
        description: 'Processing queue becomes overwhelmed',
        queue_depth_threshold: 1000,
        processing_delay_multiplier: 5
      }
    ]
  };
}

// Generate assignment test cases
function generateTestCases() {
  return {
    routing_tests: [
      {
        name: 'Single SKU Order',
        order: {
          line_items: [{ sku: 'FG1001', quantity: 1 }],
          shipping_address: { country: 'US', state: 'CA' }
        },
        expected_partner: 'linc',
        reason: 'SKU available, lowest cost'
      },
      {
        name: 'Multi-SKU Order',
        order: {
          line_items: [
            { sku: 'FG1001', quantity: 2 },
            { sku: 'FG2001', quantity: 1 }
          ],
          shipping_address: { country: 'US', state: 'NY' }
        },
        expected_behavior: 'single_partner_if_possible',
        fallback: 'split_order'
      },
      {
        name: 'High Volume Order',
        order: {
          line_items: [{ sku: 'FG3001', quantity: 5 }],
          shipping_address: { country: 'US', state: 'TX' }
        },
        expected_partner: 'wonderpack',
        reason: 'high_volume_capacity'
      },
      {
        name: 'Express Order',
        order: {
          line_items: [{ sku: 'FG1001', quantity: 1 }],
          shipping_address: { country: 'US', state: 'CA' },
          tags: 'express'
        },
        expected_partner: 'fastship',
        reason: 'express_capability'
      },
      {
        name: 'International Order',
        order: {
          line_items: [{ sku: 'FG2001', quantity: 1 }],
          shipping_address: { country: 'GB', city: 'London' }
        },
        expected_partner: 'synergy',
        reason: 'international_capability'
      }
    ],
    queue_tests: [
      {
        name: 'Priority Queue Test',
        scenario: 'Submit express and standard orders simultaneously',
        expected: 'Express orders processed first'
      },
      {
        name: 'Backpressure Test',
        scenario: 'Submit more orders than processing capacity',
        expected: 'Queue depth monitoring triggers alerts'
      },
      {
        name: 'Error Recovery Test',
        scenario: 'Simulate partner API failures',
        expected: 'Orders retry with exponential backoff'
      }
    ],
    integration_tests: [
      {
        name: 'Webhook Processing',
        scenario: 'Shopify sends order webhook',
        expected: 'Order processed and routed correctly'
      },
      {
        name: 'Partner API Integration',
        scenario: 'Send order to fulfillment partner',
        expected: 'Order accepted and tracking provided'
      },
      {
        name: 'Status Updates',
        scenario: 'Partner sends fulfillment status',
        expected: 'Shopify order updated correctly'
      }
    ]
  };
}

// Main generation function
function generateAllData() {
  const outputDir = path.join(__dirname, 'generated-data');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate and save all data
  const data = {
    skus: SAMPLE_SKUS,
    partners: TEST_PARTNERS,
    orders: generateMockOrders(100),
    test_scenarios: generateTestScenarios(),
    test_cases: generateTestCases()
  };

  // Save individual files
  Object.entries(data).forEach(([key, value]) => {
    const filename = path.join(outputDir, `${key}.json`);
    fs.writeFileSync(filename, JSON.stringify(value, null, 2));
    console.log(`Generated ${filename}`);
  });

  // Save combined file
  const combinedFile = path.join(outputDir, 'assignment-data.json');
  fs.writeFileSync(combinedFile, JSON.stringify(data, null, 2));
  console.log(`Generated ${combinedFile}`);

  // Generate environment file template
  const envTemplate = `# Assignment Environment Configuration
# Copy this to .env and fill in your values

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Shopify Configuration
SHOPIFY_SHOP_DOMAIN=your-test-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Partner API Configuration
LINC_API_KEY=test_linc_key
WONDERPACK_API_KEY=test_wonderpack_key
SYNERGY_API_KEY=test_synergy_key
FASTSHIP_API_KEY=test_fastship_key

# Queue Configuration
QUEUE_CONCURRENCY_ROUTING=30
QUEUE_CONCURRENCY_FULFILLMENT=20
QUEUE_CONCURRENCY_TAGGING=10

# Pool Configuration
REDIS_POOL_MIN=5
REDIS_POOL_MAX=80
SHOPIFY_POOL_MIN=5
SHOPIFY_POOL_MAX=50

# Monitoring Configuration
PROMETHEUS_PORT=9090
HEALTH_CHECK_INTERVAL=30000

# Assignment Specific
ASSIGNMENT_MODE=true
MOCK_PARTNER_APIS=true
GENERATE_TEST_DATA=true
`;

  const envFile = path.join(outputDir, '.env.assignment');
  fs.writeFileSync(envFile, envTemplate);
  console.log(`Generated ${envFile}`);

  console.log('\n✅ Assignment data generation complete!');
  console.log(`📁 Files generated in: ${outputDir}`);
  console.log('\n📋 Next steps:');
  console.log('1. Copy .env.assignment to .env and configure');
  console.log('2. Import test data into your development environment');
  console.log('3. Set up mock partner APIs for testing');
  console.log('4. Run the assignment tasks');
}

// Run if called directly
if (require.main === module) {
  generateAllData();
}

module.exports = {
  generateMockOrders,
  generateTestScenarios,
  generateTestCases,
  SAMPLE_SKUS,
  TEST_PARTNERS
};
