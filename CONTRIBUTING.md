# Contributing to JSON-to-SQL Flattener

Thank you for your interest in contributing to JSON-to-SQL Flattener! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and harassment-free environment for everyone.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear description** of the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node.js version, MySQL version)
- **Screenshots** if applicable
- **Error messages** and stack traces

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear description** of the enhancement
- **Use case** explaining why this would be useful
- **Proposed solution** if you have one in mind
- **Alternative solutions** you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the development setup** below
3. **Make your changes** following our coding standards
4. **Add tests** for any new functionality
5. **Ensure all tests pass** before submitting
6. **Update documentation** if needed
7. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Setup Steps

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/Json-Flattener.git
cd Json-Flattener

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Setup database
mysql -u root -p < setup/database.sql

# 5. Create backend .env file
cd ../backend
cat > .env << EOL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=test_json
PORT=3001
EOL

# 6. Run tests to verify setup
npm test
cd ../frontend
npm test
```

### Running the Development Environment

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode (`"strict": true` in tsconfig.json)
- Avoid `any` types - use proper type definitions
- Use interfaces for object shapes

### Code Style

- **Indentation**: 2 spaces
- **Line length**: 100 characters max
- **Naming conventions**:
  - camelCase for variables and functions
  - PascalCase for classes and interfaces
  - UPPER_CASE for constants
- **Comments**: Use JSDoc for public APIs

### Example:

```typescript
/**
 * Flattens a nested JSON structure into normalized tables
 * @param json - The JSON object to flatten
 * @param mappings - Field mappings configuration
 * @returns Promise with flattening results
 */
async function flattenJson(
  json: Record<string, unknown>,
  mappings: FieldMapping[]
): Promise<FlattenResult> {
  // Implementation
}
```

## Testing Requirements

All pull requests must maintain 100% test coverage on critical services.

### Running Tests

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # With coverage report

# Frontend tests
cd frontend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests with Playwright
npm run test:coverage      # With coverage report
```

### Writing Tests

#### Backend Tests (Jest)

```typescript
// Unit test example
describe('ExecutionService', () => {
  let service: ExecutionService;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      rawQuery: jest.fn(),
      close: jest.fn()
    } as any;

    container.registerInstance(DatabaseConnection, mockDb);
    service = container.resolve(ExecutionService);
  });

  it('should create tables with correct schema', async () => {
    // Arrange
    const tables = [{ name: 'test', columns: [...] }];

    // Act
    const result = await service.createTables(tables);

    // Assert
    expect(result).toContain('test');
    expect(mockDb.rawQuery).toHaveBeenCalled();
  });
});
```

#### Frontend Tests (React Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('JsonAnalyzerComponent', () => {
  it('should handle connection test', async () => {
    // Arrange
    render(<JsonAnalyzerComponent />);

    // Act
    const button = screen.getByRole('button', { name: /Test Connection/i });
    fireEvent.click(button);

    // Assert
    await screen.findByText(/Connected/i);
  });
});
```

#### E2E Tests (Playwright)

```typescript
test('should complete full workflow', async ({ page }) => {
  // Mock API
  await page.route('**/api/analysis/test-connection', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
  });

  // Test workflow
  await page.goto('/');
  await page.getByRole('button', { name: /Test Connection/i }).click();
  await expect(page.getByText(/Connected/i)).toBeVisible();
});
```

## Dependency Injection

This project uses **TSyringe** for dependency injection. All services should use constructor injection:

```typescript
import { injectable } from 'tsyringe';

@injectable()
export class MyService {
  constructor(
    private db: DatabaseConnection,
    private otherService: OtherService
  ) {}
}
```

Register services in `backend/src/container.ts`:

```typescript
container.registerSingleton(MyService, MyService);
```

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/fixes

### Commit Messages

Follow the conventional commits format:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(backend): add relationship auto-detection

Implements automatic detection of foreign key relationships
based on table_id -> table.id naming patterns.

Closes #123
```

```
fix(frontend): resolve filter builder validation issue

- Fix validation logic for IS NULL operator
- Update tests to cover edge case
```

## Pull Request Process

1. **Update documentation** for any changed functionality
2. **Add tests** covering your changes
3. **Ensure CI passes** - all tests must pass
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Squash commits** if requested

### PR Title Format

```
type(scope): brief description
```

Example: `feat(backend): add support for PostgreSQL connections`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Architecture Guidelines

### Backend Structure

```
backend/
├── src/
│   ├── container.ts          # DI configuration
│   ├── index.ts              # Entry point
│   ├── database/
│   │   └── connection.ts     # Database abstraction
│   ├── services/             # Business logic
│   │   ├── executionService.ts
│   │   ├── filterPresetService.ts
│   │   └── mappingConfigService.ts
│   └── routes/               # API endpoints
│       ├── analysisRoutes.ts
│       ├── filterRoutes.ts
│       └── mappingRoutes.ts
└── tests/
    ├── unit/                 # Service unit tests
    └── integration/          # API integration tests
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   ├── services/             # API clients
│   ├── types/                # TypeScript types
│   └── App.tsx              # Main component
└── tests/
    ├── components/           # Component tests
    └── e2e/                  # Playwright tests
```

## Getting Help

- **Questions?** Open a GitHub Discussion
- **Bug?** Open a GitHub Issue
- **Security issue?** Email the maintainers directly

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation

Thank you for contributing! 🎉
