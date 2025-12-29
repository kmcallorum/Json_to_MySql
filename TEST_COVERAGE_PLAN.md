# 100% Test Coverage Plan

## Current State Analysis

### Backend (TypeScript/Node.js)
- **Structure**: ES modules, TypeScript
- **Routes**: filterRoutes, mappingRoutes, analysisRoutes, tableRoutes
- **Services**: mappingConfigService, filterPresetService, executionService, relationshipService
- **Database**: MySQL connection layer
- **Test Coverage**: 0% (no tests exist)

### Frontend (React/TypeScript)
- **Components**: Analysis, Mapping, Filters
- **Test Coverage**: ~10% (only basic example tests)

### Testing Infrastructure Available
- ✅ Jest configured
- ✅ Playwright for E2E
- ✅ React Testing Library
- ❌ Backend testing not set up

## Coverage Target: 100%

### What 100% Coverage Means
- **Lines**: 100% - Every line of code executed
- **Functions**: 100% - Every function called
- **Branches**: 100% - Every if/else, switch case tested
- **Statements**: 100% - Every statement executed

## Testing Strategy

### 1. Backend Unit Tests (Services)

**Files to Test:**
- `src/services/mappingConfigService.ts`
- `src/services/filterPresetService.ts`
- `src/services/executionService.ts`
- `src/services/relationshipService.ts`

**Approach:**
- Mock database connection
- Test all public methods
- Test error handling
- Test edge cases (null, undefined, empty arrays)
- Test data transformations

**Example Test Structure:**
```typescript
describe('MappingConfigService', () => {
  describe('saveConfig', () => {
    it('should save new config successfully')
    it('should update existing config')
    it('should handle duplicate key error')
    it('should throw on database error')
  })

  describe('loadConfig', () => {
    it('should load config by name')
    it('should return null when not found')
    it('should parse JSON fields correctly')
  })
})
```

### 2. Backend Unit Tests (Routes)

**Files to Test:**
- `src/routes/filterRoutes.ts`
- `src/routes/mappingRoutes.ts`
- `src/routes/analysisRoutes.ts`
- `src/routes/tableRoutes.ts`

**Approach:**
- Use supertest for HTTP testing
- Mock service layer dependencies
- Test all endpoints
- Test success responses
- Test error responses
- Test validation
- Test different status codes

**Example:**
```typescript
describe('POST /api/mappings/save', () => {
  it('should return 200 with saved config')
  it('should return 400 when name missing')
  it('should return 500 on database error')
})
```

### 3. Backend Integration Tests

**Scope:**
- Test full request/response cycle
- Use real database (test database)
- Test data persistence
- Test complex workflows

**Files:**
```
backend/tests/integration/
  - mappings.integration.test.ts
  - filters.integration.test.ts
  - analysis.integration.test.ts
  - tables.integration.test.ts
```

### 4. Frontend Unit Tests (Components)

**Files to Test:**
- `src/components/analysis/JsonAnalyzerComponent.tsx`
- `src/components/analysis/AnalysisResults.tsx`
- `src/components/mapping/TableSelector.tsx`
- `src/components/mapping/DragDropMapper.tsx`
- `src/components/mapping/RelationshipEditor.tsx`
- `src/components/mapping/SqlGenerator.tsx`
- `src/components/mapping/SaveLoadConfig.tsx`
- `src/components/filters/FilterBuilder.tsx`
- `src/components/filters/FilterPresets.tsx`
- `src/App.tsx`

**Approach:**
- Use React Testing Library
- Mock API calls
- Test user interactions
- Test state changes
- Test conditional rendering
- Test error states

### 5. Frontend Integration Tests

**Scope:**
- Test component interactions
- Test full workflows
- Test form submissions
- Test data flow between components

### 6. E2E Tests (Playwright)

**User Flows to Test:**
1. Complete analysis workflow (discover → filter → analyze → map → execute)
2. Save and load configuration
3. Save and load filter preset
4. Create custom tables
5. Load existing tables
6. Error handling scenarios

## Implementation Plan

### Phase 1: Backend Test Infrastructure (Day 1)
- [ ] Install testing dependencies for backend
- [ ] Configure Jest for TypeScript/ESM
- [ ] Set up test database
- [ ] Create test utilities and mocks
- [ ] Create mock data factories

### Phase 2: Backend Service Tests (Day 1-2)
- [ ] MappingConfigService tests (100% coverage)
- [ ] FilterPresetService tests (100% coverage)
- [ ] ExecutionService tests (100% coverage)
- [ ] RelationshipService tests (100% coverage)

### Phase 3: Backend Route Tests (Day 2)
- [ ] filterRoutes tests (100% coverage)
- [ ] mappingRoutes tests (100% coverage)
- [ ] analysisRoutes tests (100% coverage)
- [ ] tableRoutes tests (100% coverage)

### Phase 4: Backend Integration Tests (Day 2-3)
- [ ] End-to-end API tests with real database
- [ ] Data persistence tests
- [ ] Complex workflow tests

### Phase 5: Frontend Component Tests (Day 3)
- [ ] Analysis components
- [ ] Mapping components
- [ ] Filter components
- [ ] App component

### Phase 6: E2E Tests (Day 3-4)
- [ ] Complete workflow tests
- [ ] Error scenario tests
- [ ] Performance tests

### Phase 7: Coverage Verification (Day 4)
- [ ] Run full test suite
- [ ] Generate coverage reports
- [ ] Identify any gaps
- [ ] Add missing tests to reach 100%

## Test File Structure

```
Json-Flattner/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── database/
│   └── tests/
│       ├── unit/
│       │   ├── services/
│       │   │   ├── mappingConfigService.test.ts
│       │   │   ├── filterPresetService.test.ts
│       │   │   ├── executionService.test.ts
│       │   │   └── relationshipService.test.ts
│       │   └── routes/
│       │       ├── filterRoutes.test.ts
│       │       ├── mappingRoutes.test.ts
│       │       ├── analysisRoutes.test.ts
│       │       └── tableRoutes.test.ts
│       ├── integration/
│       │   ├── mappings.integration.test.ts
│       │   ├── filters.integration.test.ts
│       │   ├── analysis.integration.test.ts
│       │   └── tables.integration.test.ts
│       └── helpers/
│           ├── mockDatabase.ts
│           ├── testData.ts
│           └── testUtils.ts
├── frontend/
│   ├── src/
│   │   └── components/
│   └── tests/
│       ├── unit/
│       │   ├── JsonAnalyzerComponent.test.tsx
│       │   ├── AnalysisResults.test.tsx
│       │   ├── TableSelector.test.tsx
│       │   ├── DragDropMapper.test.tsx
│       │   ├── RelationshipEditor.test.tsx
│       │   ├── SqlGenerator.test.tsx
│       │   ├── SaveLoadConfig.test.tsx
│       │   ├── FilterBuilder.test.tsx
│       │   └── FilterPresets.test.tsx
│       └── e2e/
│           ├── complete-workflow.spec.ts
│           ├── save-load-config.spec.ts
│           └── error-handling.spec.ts
└── e2e/
    └── complete-workflow.spec.js
```

## Dependencies Needed

### Backend Testing
```json
{
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/supertest": "^2.0.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "supertest": "^6.3.3",
    "jest-mock-extended": "^3.0.5"
  }
}
```

### Frontend Testing (already installed)
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- @playwright/test

## Success Criteria

✅ All tests pass
✅ 100% line coverage
✅ 100% function coverage
✅ 100% branch coverage
✅ 100% statement coverage
✅ All edge cases tested
✅ All error paths tested
✅ All user flows working in E2E tests

## Coverage Commands

```bash
# Backend tests
cd backend
npm run test:coverage

# Frontend tests
cd frontend
npm run test:coverage

# Full project coverage
npm run test:all:coverage

# Coverage report
npm run coverage:report

# Verify 100% coverage
npm run coverage:check
```

## Next Steps

1. Set up backend test infrastructure
2. Start with service layer (bottom-up testing)
3. Move to routes (API layer)
4. Integration tests
5. Frontend components
6. E2E tests
7. Verify 100% coverage

---

**Timeline: 3-4 days for complete 100% coverage**

**Current Focus: Phase 1 - Backend Test Infrastructure**
