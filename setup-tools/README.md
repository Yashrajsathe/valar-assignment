# SnapFulfil Assignment Setup

This directory contains all the resources needed to set up and evaluate the SnapFulfil technical assignment.

## Files Overview

### Core Assignment
- **`../TECHNICAL_ASSIGNMENT.md`** - Main assignment document with detailed requirements
- **`evaluation-rubric.md`** - Comprehensive scoring rubric for evaluation

### Setup Tools
- **`dummy-data-generator.js`** - Generates test data, orders, and configurations
- **`mock-partner-server.js`** - Mock API server simulating fulfillment partners
- **`setup-instructions.md`** - Step-by-step setup guide

### Generated Data (after running setup)
- **`generated-data/`** - Directory containing all generated test data
  - `skus.json` - Sample product SKUs with volume/weight data
  - `partners.json` - Test fulfillment partner configurations
  - `orders.json` - Mock Shopify orders for testing
  - `test_scenarios.json` - Load testing and error scenarios
  - `test_cases.json` - Specific test cases for validation
  - `.env.assignment` - Environment template for assignment

## Quick Start

### 1. Generate Test Data
```bash
cd assignment/setup-tools
node dummy-data-generator.js
```

### 2. Start Mock Partner APIs
```bash
node mock-partner-server.js
```

### 3. Configure Environment
```bash
cp ../env.example ../.env
# Edit .env with your actual values
```

### 4. Run Assignment Tests
```bash
cd ..
npm test
```

## Assignment Structure

### Task Breakdown
1. **Multi-Partner Routing Algorithm** (2 hours)
   - Smart load balancing
   - Partner priority system
   - Volume-based order splitting

2. **Queue System Optimization** (1.5 hours)
   - Connection pool management
   - Queue prioritization
   - Error recovery system

3. **Real-time Monitoring & Alerting** (1.5 hours)
   - Metrics collection
   - Health check system
   - Alert configuration

4. **Partner Integration & API Management** (2 hours)
   - New partner integration
   - API gateway pattern
   - Webhook management

5. **Advanced Order Processing** (1 hour)
   - Order validation engine
   - Transformation pipeline
   - Batch processing

### Bonus Challenges
- Machine learning integration
- Multi-region support
- Performance optimization

## Evaluation Process

### Automated Checks
The assignment includes automated validation for:
- Code quality and linting
- Test coverage requirements
- Performance benchmarks
- Security vulnerability scanning

### Manual Review Areas
- Architecture and design decisions
- Code readability and maintainability
- Problem-solving approach
- Innovation and creativity

### Demo Requirements
Candidates should prepare a 30-minute demo covering:
- System architecture overview
- Key feature demonstrations
- Performance improvements
- Code walkthrough

## Success Metrics

### Functional Requirements
- ✅ All routing algorithms work correctly
- ✅ Queue processing handles high load (100+ orders/minute)
- ✅ Partner integrations are reliable
- ✅ Monitoring provides actionable insights
- ✅ Error handling is robust

### Performance Requirements
- ✅ <2 second average routing decision time
- ✅ 99.9% uptime for core services
- ✅ <5% error rate under normal load
- ✅ Graceful degradation under high load

### Quality Requirements
- ✅ 80%+ test coverage
- ✅ Zero critical security vulnerabilities
- ✅ Comprehensive error logging
- ✅ Production-ready code quality

## Support Resources

### Documentation
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Best Practices](https://redis.io/docs/manual/)
- [Shopify API Documentation](https://shopify.dev/api)
- [Prometheus Metrics](https://prometheus.io/docs/)

### Testing Tools
- Jest for unit testing
- Artillery/k6 for load testing
- Postman for API testing
- Redis CLI for queue inspection

### Mock APIs
The mock partner server provides realistic API responses with:
- Configurable delays and error rates
- Order tracking and status updates
- Capacity and health monitoring
- Webhook simulation

## Troubleshooting

### Common Issues

#### Redis Connection Errors
```bash
# Check Redis is running
redis-cli ping

# Start Redis if needed
redis-server
```

#### Mock Server Not Responding
```bash
# Check if server is running
curl http://localhost:3001/health

# Restart mock server
node assignment-setup/mock-partner-server.js
```

#### Test Data Generation Fails
```bash
# Ensure output directory exists
mkdir -p assignment-setup/generated-data

# Run with verbose output
DEBUG=* node assignment-setup/dummy-data-generator.js
```

### Environment Variables
Ensure these are set in your `.env` file:
- `REDIS_HOST` and `REDIS_PORT`
- `SHOPIFY_SHOP_DOMAIN` and `SHOPIFY_ACCESS_TOKEN`
- Partner API keys for testing
- Queue and pool configurations

### Performance Tuning
For optimal performance during testing:
- Increase Redis memory limit
- Adjust queue concurrency settings
- Monitor connection pool usage
- Use appropriate logging levels

## Contact & Support

For questions about the assignment:
1. Check the troubleshooting section
2. Review the main assignment document
3. Examine the evaluation rubric
4. Contact the technical team

---

**Note:** This assignment simulates real-world production challenges. Focus on building robust, scalable solutions that demonstrate your ability to work with complex distributed systems.
