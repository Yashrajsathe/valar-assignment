# SnapFulfil Technical Assignment

## Overview
This assignment tests the core skills needed to build and maintain the SnapFulfil order routing and fulfillment system. You'll work with a sophisticated multi-partner fulfillment network that processes orders through complex routing algorithms, queue systems, and real-time distribution optimization.

**Estimated Time:** 3-4 hours for an expert programmer
**Technologies:** Node.js, Express, Redis, BullMQ, Shopify GraphQL APIs, Connection Pooling, Prometheus

## System Context
SnapFulfil routes orders between multiple fulfillment partners:
- **F1** (UK/EU primary) - Multi-item orders, address validation
- **F2** (UK/EU) - Single-item orders, specific SKU combinations  
- **F3** (UK/EU) - Refill SKUs only (REFILL-001, REFILL-002, REFILL-003)
- **F-US** (US) - All US orders (USD currency + US SKUs)

The system processes 170+ active SKUs with volume caps, percentage splits, and cost-minimizing algorithms.

## Prerequisites Setup

### 1. Environment Setup
- Clone the repository and install dependencies
- Set up Redis instance (local or cloud)
- Create a Shopify development store
- Configure ngrok for webhook testing
- Set up environment variables based on `.env.example`

### 2. Dummy Store Configuration
Create a Shopify development store with:
- 50+ test products with various SKUs
- Multiple product variants
- Different shipping addresses (US, UK, international)
- Various order values ($10-$500)
- Test customers with different email domains

## Assignment Tasks

### Task 1: Basic Routing Algorithm Implementation (1.5 hours)

#### Background
Implement a simplified version of the routing system that demonstrates understanding of the core business logic and partner selection.

#### Basic Routing Rules to Implement:
1. **US Detection** → If order has USD currency AND US SKUs → Route to F-US
2. **F3 Routing** → If single refill SKU (REFILL-001, REFILL-002, REFILL-003) → Route to F3
3. **Multi-item Check** → If >1 line item → Route to F1
4. **Default Routing** → Single UK/EU items → Route to F2

#### Requirements
1. **Create Basic Routing Service**
   - Implement `determinePartner(orderData)` function
   - Handle the 4 routing rules above
   - Return partner name and routing reason
   - Add basic error handling for invalid orders

2. **Simple Volume Tracking**
   - Track daily order counts per partner in Redis
   - Implement basic volume cap checking (configurable limits)
   - Fallback to F1 when partner at capacity

#### Deliverables
- Working routing service with basic business logic
- Redis-based volume tracking
- Unit tests covering main routing scenarios
- Simple configuration for volume caps

### Task 2: Basic Queue Processing (1 hour)

#### Background
Implement a simple queue system to process orders and demonstrate understanding of async job processing and error handling.

#### Requirements
1. **Create Order Processing Queue**
   - Set up a single BullMQ queue for order processing
   - Create job processor that calls your routing service
   - Add basic job retry logic (3 attempts with delay)
   - Handle job failures gracefully

2. **Basic Error Handling**
   - Implement timeout wrapper for Redis operations (5 second timeout)
   - Add try/catch blocks with proper error logging
   - Create simple fallback when Redis is unavailable

#### Deliverables
- Working BullMQ queue with order processing
- Basic error handling and retry logic
- Simple monitoring endpoint showing queue status

### Task 3: Basic Monitoring & Health Checks (30 minutes)

#### Background
Add simple monitoring to track system health and order processing.

#### Requirements
1. **Basic Health Checks**
   - Create `/health` endpoint that checks Redis connectivity
   - Add queue status to health check (job counts, failed jobs)
   - Return appropriate HTTP status codes

2. **Simple Metrics**
   - Track total orders processed per partner
   - Count successful vs failed routing decisions
   - Basic response time tracking

#### Deliverables
- Health check endpoint with Redis and queue status
- Simple metrics collection
- Basic logging for debugging

### Bonus Task: Basic Order Validation (Optional - 30 minutes)

#### Background
Add simple validation to demonstrate understanding of business rules and data validation.

#### Requirements
1. **Basic Order Validation**
   - Check if order has valid SKUs (from provided SKU list)
   - Validate required fields (order_number, line_items, shipping_address)
   - Simple fraud detection (flag orders with >10 quantity of any item)

2. **Address Validation**
   - Basic address format checking (required fields present)
   - Simple country code validation

#### Deliverables
- Basic validation functions with clear error messages
- Simple fraud flagging logic

## Additional Challenges (If Time Permits)

### Challenge 1: Configuration Management
- Create a simple admin endpoint to update volume caps
- Add configuration validation
- Implement hot-reloading of routing rules

### Challenge 2: Basic Analytics
- Track routing decisions over time
- Simple partner performance comparison
- Basic reporting endpoint

## Testing Requirements

### Unit Tests (Required)
- Test routing logic for all 4 scenarios
- Test volume cap checking
- Mock Redis operations
- Test error handling

### Integration Tests (Optional)
- End-to-end order processing through queue
- Basic queue functionality testing

## Evaluation Criteria

### Code Quality (30%)
- Clean, readable code with proper structure
- Basic error handling and logging
- Follows Node.js best practices

### Functionality (40%)
- Routing logic works correctly for all scenarios
- Queue processing functions properly
- Basic monitoring/health checks work
- Handles edge cases appropriately

### Testing (20%)
- Unit tests cover main routing scenarios
- Tests demonstrate understanding of business logic
- Proper mocking of external dependencies

### Documentation (10%)
- Clear README with setup instructions
- Code comments explaining business logic
- Basic API documentation

## Submission Guidelines

### Required Deliverables
1. Working source code for all 3 main tasks
2. Unit tests with basic coverage
3. README with setup and run instructions
4. Brief explanation of routing decisions and architecture choices

### Submission Format
- Git repository with clear commit messages
- README.md with setup instructions
- Working code that can be run locally

### Demo Requirements (15 minutes)
Prepare a brief demo covering:
1. How the routing logic works
2. Demonstration with sample orders
3. Queue processing in action
4. Code walkthrough of key functions

## Success Metrics

### Functional Requirements
- [ ] Routing logic correctly handles all 4 scenarios
- [ ] Queue processes orders without errors
- [ ] Volume caps work as expected
- [ ] Health checks return proper status
- [ ] Basic error handling works

### Quality Requirements
- [ ] Unit tests cover main routing scenarios
- [ ] Code is clean and well-structured
- [ ] Basic error logging present
- [ ] README allows easy setup and testing

## Additional Resources

### Helpful Documentation
- BullMQ Documentation: https://docs.bullmq.io/
- Redis Best Practices: https://redis.io/docs/manual/
- Shopify API Documentation: https://shopify.dev/api
- Prometheus Metrics: https://prometheus.io/docs/

### Sample Data
Use the provided test data generator in `assignment-setup/` for:
- Sample SKUs and routing scenarios
- Mock partner configurations
- Test orders for different routing cases

### Testing Tools
- Jest for unit testing
- Redis CLI for debugging
- Postman for API testing

---

**Note:** This assignment focuses on core fulfillment routing concepts. Demonstrate clean code, solid understanding of the business logic, and basic system design principles.
