# SnapFulfil Technical Assignment

This folder contains everything needed for the SnapFulfil technical assignment.

## 📁 Folder Structure

```
assignment/
├── instructions.md          # Main assignment document
├── README.md               # This file - overview and quick start
├── setup-tools/            # Tools to help with assignment setup
│   ├── dummy-data-generator.js
│   ├── mock-partner-server.js
│   ├── evaluation-rubric.md
│   └── README.md
└── sample-solution/        # Reference implementation (for evaluators)
```

## 🚀 Quick Start for Candidates

1. **Read the Instructions**
   ```bash
   cat instructions.md
   ```

2. **Set Up Test Environment**
   ```bash
   cd setup-tools
   node dummy-data-generator.js
   node mock-partner-server.js &
   ```

3. **Start Building**
   - Create your routing service
   - Implement queue processing
   - Add basic monitoring
   - Write tests

## 📋 Assignment Overview

**Time Estimate:** 3-4 hours for an expert programmer

**Core Tasks:**
1. **Basic Routing Algorithm** (1.5 hours) - Implement 4 core routing rules
2. **Queue Processing** (1 hour) - Set up BullMQ with error handling
3. **Monitoring** (30 minutes) - Add health checks and basic metrics
4. **Bonus Validation** (30 minutes) - Optional order validation

## 🛠️ Setup Tools Included

### `dummy-data-generator.js`
Generates realistic test data:
- Sample SKUs based on actual system
- Mock fulfillment partners
- Test orders for different scenarios
- Performance test scenarios

### `mock-partner-server.js`
Mock API server that simulates partner APIs:
- Realistic response delays and error rates
- Order tracking and status updates
- Capacity monitoring
- Webhook simulation

### `evaluation-rubric.md`
Detailed scoring criteria for evaluators:
- Code quality assessment
- Functionality requirements
- Testing standards
- Documentation expectations

## 🎯 What We're Testing

This assignment evaluates:
- **Business Logic Understanding** - Can they implement routing rules correctly?
- **Queue Processing** - Do they understand async job processing with BullMQ?
- **Error Handling** - Can they handle failures gracefully?
- **Code Quality** - Is the code clean, readable, and well-structured?
- **Testing** - Can they write meaningful unit tests?

## 📊 Success Criteria

### Must Have:
- ✅ Routing logic handles all 4 scenarios correctly
- ✅ Queue processes orders without errors
- ✅ Basic health checks work
- ✅ Unit tests cover main scenarios
- ✅ Clean, readable code

### Nice to Have:
- ✅ Volume caps implementation
- ✅ Basic order validation
- ✅ Good error handling and logging
- ✅ Configuration management

## 🔧 For Evaluators

### Running the Assignment
1. Review the candidate's submission
2. Check that all deliverables are present
3. Run the code locally following their README
4. Execute the test suite
5. Use the evaluation rubric for scoring

### Key Things to Look For
- **Routing Logic Correctness** - Do the 4 rules work as specified?
- **Code Structure** - Is it well-organized and maintainable?
- **Error Handling** - How do they handle edge cases and failures?
- **Testing Quality** - Are tests meaningful and comprehensive?
- **Documentation** - Can someone else run and understand the code?

## 📞 Support

For questions about the assignment:
1. Check the troubleshooting section in `setup-tools/README.md`
2. Review the evaluation rubric for clarification
3. Contact the technical team if needed

---

**Note:** This assignment is designed to be challenging but achievable within the time limit. Focus on demonstrating solid fundamentals rather than advanced features.
