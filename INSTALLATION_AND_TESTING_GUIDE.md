# Installation and Testing Guide

## Setup for Testing

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- jest
- ts-jest
- supertest
- @types/jest
- @types/supertest

### 2. Install Frontend Dependencies

Frontend testing dependencies should already be installed. If not:

```bash
cd frontend
npm install
```

### 3. Database Setup for Testing

Create a test database:

```sql
CREATE DATABASE test_json;
USE test_json;

-- Create required tables
CREATE TABLE IF NOT EXISTS filter_presets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  base_table_name VARCHAR(255) NOT NULL,
  where_conditions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mapping_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  base_table_name VARCHAR(255) NOT NULL,
  where_conditions JSON,
  tables JSON NOT NULL,
  mappings JSON NOT NULL,
  fields JSON,
  relationships JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add test data table
CREATE TABLE IF NOT EXISTS platforms_cicd_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platforms_cicd_data_toprocess (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample test data
INSERT INTO platforms_cicd_data (content) VALUES
('{"_source": {"eventData": {"type": "pipeline.test", "timestamp": 1640000000}, "pipelineData": {"name": "test-pipeline", "status": "running"}}}'),
('{"_source": {"eventData": {"type": "pipeline.run", "timestamp": 1640000100}, "pipelineData": {"name": "prod-pipeline", "status": "completed"}}}');
```

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### E2E Tests

```bash
# Make sure both backend and frontend are running first!

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - E2E Tests
npx playwright test

# Run in UI mode for debugging
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed
```

## Coverage Reports

After running tests with coverage:

### Backend Coverage
```bash
cd backend
npm run test:coverage

# View HTML report
open coverage/index.html  # macOS
# or
start coverage/index.html  # Windows
# or
xdg-open coverage/index.html  # Linux
```

### Frontend Coverage
```bash
cd frontend
npm run test:coverage

# View HTML report
open coverage/index.html
```

## Expected Coverage Results

With all tests implemented, you should see:

### Backend
```
Statements   : 100% ( xxx/xxx )
Branches     : 100% ( xxx/xxx )
Functions    : 100% ( xxx/xxx )
Lines        : 100% ( xxx/xxx )
```

### Frontend
```
Statements   : 100% ( xxx/xxx )
Branches     : 100% ( xxx/xxx )
Functions    : 100% ( xxx/xxx )
Lines        : 100% ( xxx/xxx )
```

## Troubleshooting

### Backend Tests Failing

**Issue:** ESM module errors
**Solution:** Make sure you're using `NODE_OPTIONS=--experimental-vm-modules jest`

**Issue:** Database connection errors
**Solution:** Check your `.env` file in backend directory

**Issue:** Cannot find module
**Solution:** Run `npm install` in backend directory

### Frontend Tests Failing

**Issue:** Cannot find React Testing Library
**Solution:** `npm install --save-dev @testing-library/react @testing-library/jest-dom`

**Issue:** API mocks not working
**Solution:** Make sure `jest.mock('../../services/api')` is at the top of test files

### E2E Tests Failing

**Issue:** Cannot connect to http://localhost:3000
**Solution:** Make sure frontend is running (`npm run dev` in frontend directory)

**Issue:** Timeouts
**Solution:** Increase timeout in playwright.config.ts or wait for elements properly

**Issue:** Database not found
**Solution:** Make sure backend is running and database is set up

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm run test:coverage

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run tests
        run: cd frontend && npm run test:coverage
```

## Test Files Structure

```
backend/
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── mappingConfigService.test.ts
│   │   │   ├── filterPresetService.test.ts
│   │   │   ├── executionService.test.ts
│   │   │   └── relationshipService.test.ts
│   │   └── routes/
│   │       ├── mappingRoutes.test.ts
│   │       ├── filterRoutes.test.ts
│   │       ├── analysisRoutes.test.ts
│   │       └── tableRoutes.test.ts
│   ├── integration/
│   │   └── fullWorkflow.integration.test.ts
│   └── helpers/
│       ├── mockDatabase.ts
│       ├── testData.ts
│       └── testUtils.ts

frontend/
├── src/
│   └── tests/
│       ├── App.test.tsx
│       └── components/
│           ├── FilterBuilder.test.tsx
│           ├── FilterPresets.test.tsx
│           ├── JsonAnalyzerComponent.test.tsx
│           └── SaveLoadConfig.test.tsx

e2e/
└── complete-workflow.spec.ts
```

## Next Steps

1. Run backend tests: `cd backend && npm test`
2. Run frontend tests: `cd frontend && npm test`
3. Run E2E tests: `npx playwright test`
4. Review coverage reports
5. Add any missing tests for 100% coverage

## Coverage Threshold

The project is configured to require 100% coverage. If coverage drops below 100%, the build will fail. This ensures all code paths are tested.

To temporarily bypass (not recommended):
```json
// In package.json jest config
"coverageThreshold": {
  "global": {
    "branches": 90,  // Reduced from 100
    "functions": 90,
    "lines": 90,
    "statements": 90
  }
}
```

## Support

If you encounter any issues with testing:
1. Check this guide first
2. Review the test files for examples
3. Check console output for specific error messages
4. Ensure all dependencies are installed
5. Verify database is set up correctly
