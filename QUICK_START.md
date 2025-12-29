# 🚀 Quick Start Guide - JSON-to-SQL Flattener Testing

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js 18+ installed
- npm 9+ installed
- Git installed

### Installation

```bash
# 1. Navigate to your project directory
cd /path/to/json-to-sql-flattener

# 2. Copy all test files from the downloaded folder
cp -r json-to-sql-testing/* .

# 3. Install all dependencies
npm install

# This will install:
# ✅ Jest & React Testing Library (Unit tests)
# ✅ Cucumber (BDD tests)
# ✅ Playwright (E2E tests)
# ✅ Artillery (Performance tests)
# ✅ axe-core (Accessibility tests)
# ✅ All code quality tools

# 4. Install Playwright browsers
npx playwright install

# 5. Run your first test
npm run test:unit
```

**That's it!** You're ready to start testing! 🎉

---

## 🎯 Your First TDD Cycle

### 1. Start Watch Mode
```bash
npm run test:unit:watch
```

### 2. Write a Failing Test
Create `backend/services/jsonAnalyzer.js` if it doesn't exist:

```javascript
// backend/services/jsonAnalyzer.js
class JsonAnalyzer {
  // Empty for now - tests will drive implementation
}

module.exports = JsonAnalyzer;
```

The tests in `__tests__/unit/jsonAnalyzer.test.js` will fail. That's good! ❌

### 3. Make Tests Pass
Implement the methods one by one:

```javascript
class JsonAnalyzer {
  analyzeJsonStructure(json) {
    if (!json) {
      throw new Error('Input cannot be null or undefined');
    }
    
    if (typeof json === 'string') {
      throw new Error('Invalid JSON structure');
    }
    
    // Build your implementation here
    return {
      name: 'root',
      fields: this._extractFields(json),
      tables: [],
      relationships: [],
      indexes: []
    };
  }
  
  _extractFields(obj) {
    return Object.keys(obj).map(key => ({
      name: key,
      type: this.inferDataType(obj[key]),
      nullable: obj[key] === null || obj[key] === undefined,
      primaryKey: key === 'id'
    }));
  }
  
  inferDataType(value) {
    if (value === null || value === undefined) return 'TEXT';
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value > 2147483647 ? 'BIGINT' : 'INT';
      }
      return 'DECIMAL(10,2)';
    }
    if (typeof value === 'string') {
      if (value.length > 255) return 'TEXT';
      if (value.match(/^\d{4}-\d{2}-\d{2}T/)) return 'DATETIME';
      return 'VARCHAR(255)';
    }
    if (typeof value === 'object') return 'JSON';
    return 'TEXT';
  }
}

module.exports = JsonAnalyzer;
```

Watch tests turn green! ✅

---

## 🧪 Running Different Test Types

### Unit Tests (Fastest - Run Most Often)
```bash
# Run once
npm run test:unit

# Watch mode (TDD)
npm run test:unit:watch

# With coverage
npm run test:unit:coverage
```

### Integration Tests
```bash
# Make sure MySQL and Elasticsearch are running
npm run test:integration
```

### BDD Tests
```bash
# Run Cucumber scenarios
npm run test:bdd

# Watch mode
npm run test:bdd:watch
```

### E2E Tests
```bash
# All browsers
npm run test:e2e

# Specific browser
npx playwright test --project=chromium

# With UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### All Tests
```bash
# Run everything
npm test

# With coverage reports
npm run test:all:coverage
```

---

## 📊 Checking Coverage

### Generate Report
```bash
npm run coverage:report
```

### View in Browser
```bash
open coverage/index.html
```

### Check Thresholds
```bash
npm run coverage:check

# Should output:
# ✅ Lines: 100%
# ✅ Branches: 100%
# ✅ Functions: 100%
# ✅ Statements: 100%
```

---

## 🏗️ Project Structure (What You Get)

```
your-project/
├── __tests__/              ← Your test files
│   ├── setup.js           ← Global test setup
│   ├── unit/              ← Unit tests (90+ tests)
│   └── integration/       ← Integration tests (template)
│
├── features/              ← BDD scenarios
│   ├── *.feature         ← Gherkin scenarios
│   └── step_definitions/ ← Step implementations
│
├── e2e/                   ← E2E tests
│   └── *.spec.js         ← Playwright tests
│
├── backend/               ← Your backend code
│   └── services/         ← Implement services here
│
├── frontend/              ← Your frontend code
│   └── src/              ← React components here
│
├── package.json           ← All dependencies
├── jest.config.js         ← Jest configuration
├── playwright.config.js   ← Playwright configuration
├── cucumber.config.js     ← Cucumber configuration
│
└── Documentation/
    ├── IMPLEMENTATION_SUMMARY.md  ← Start here!
    ├── TESTING_STRATEGY.md        ← Testing overview
    ├── TESTING_README.md          ← Daily reference
    └── TDD_BDD_GUIDE.md          ← Implementation guide
```

---

## 🎬 Common Workflows

### Adding a New Feature

1. **Write BDD Scenario First**
```gherkin
# features/my-feature.feature
Scenario: User can do something
  Given initial state
  When user action
  Then expected outcome
```

2. **Write Unit Tests (TDD)**
```javascript
// __tests__/unit/myService.test.js
test('should do something', () => {
  // Test implementation
});
```

3. **Implement Code**
```javascript
// backend/services/myService.js
class MyService {
  doSomething() {
    // Your implementation
  }
}
```

4. **Add E2E Test**
```javascript
// e2e/my-feature.spec.js
test('user can complete workflow', async ({ page }) => {
  // User journey
});
```

5. **Verify Everything**
```bash
npm test
```

### Before Committing

```bash
# Run pre-commit checks
npm run lint            # Check code style
npm test               # Run all tests
npm run coverage:check # Verify 100% coverage
```

### Creating a Pull Request

GitHub Actions will automatically:
- ✅ Run all tests
- ✅ Check coverage (must be 100%)
- ✅ Run security scan
- ✅ Test on multiple browsers
- ✅ Report results on PR

---

## 🔧 Troubleshooting

### Tests Fail on Installation

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Playwright Browsers Not Installed

```bash
npx playwright install --with-deps
```

### Coverage Below 100%

```bash
# Generate detailed report
npm run coverage:report
open coverage/index.html

# Look for red/yellow highlighted lines
# Add tests for uncovered code
```

### E2E Tests Timing Out

```bash
# Increase timeout in playwright.config.js
timeout: 60 * 1000  // 60 seconds
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Documentation Quick Links

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `IMPLEMENTATION_SUMMARY.md` | Project overview | **Start here!** |
| `TESTING_STRATEGY.md` | Testing architecture | Before implementing |
| `TESTING_README.md` | Daily reference | During development |
| `TDD_BDD_GUIDE.md` | Step-by-step guide | When learning TDD/BDD |

---

## ✅ Verification Checklist

After setup, verify everything works:

```bash
# 1. Unit tests run
npm run test:unit
# Expected: All tests pass ✅

# 2. BDD tests run
npm run test:bdd
# Expected: All scenarios pass ✅

# 3. E2E tests run
npm run test:e2e
# Expected: Tests pass in all browsers ✅

# 4. Coverage is tracked
npm run coverage:report
# Expected: HTML report generated ✅

# 5. Linting works
npm run lint
# Expected: No errors ✅
```

If all ✅, you're ready to code! 🚀

---

## 🎯 Next Steps

1. **Read IMPLEMENTATION_SUMMARY.md** for full overview
2. **Start with TDD** - `npm run test:unit:watch`
3. **Implement services** one test at a time
4. **Add BDD scenarios** for features
5. **Build frontend** with component tests
6. **Add E2E tests** for user journeys
7. **Keep coverage at 100%** always!

---

## 💡 Pro Tips

- Always run tests in watch mode during development
- Write tests BEFORE writing code (TDD)
- Use BDD scenarios to clarify requirements
- Check coverage after every feature
- Let CI/CD catch issues early
- Keep tests fast (< 100ms each)
- Make test failures clear and actionable

---

## 🆘 Getting Help

If you encounter issues:

1. Check the documentation files
2. Look at test examples provided
3. Run with `--verbose` for details
4. Check CI/CD logs if tests pass locally but fail in CI

---

## 🎉 You're All Set!

You now have:
- ✅ Complete testing infrastructure
- ✅ TDD/BDD workflows
- ✅ 100% coverage enforcement
- ✅ Multi-browser E2E testing
- ✅ CI/CD automation
- ✅ Comprehensive documentation

**Happy testing!** 🚀

---

**Remember**: 
- Tests are your safety net
- Write tests first (TDD)
- Keep them green
- Refactor fearlessly
- Maintain 100% coverage
