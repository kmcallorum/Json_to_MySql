/**
 * Backend-specific Test Setup
 * Runs before each backend test file
 */

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.env for backend tests
process.env.NODE_ENV = 'test';
process.env.MYSQL_HOST = 'localhost';
process.env.MYSQL_PORT = '3306';
process.env.MYSQL_USER = 'test';
process.env.MYSQL_PASSWORD = 'test';
process.env.MYSQL_DATABASE = 'test_db';
process.env.ES_HOST = 'localhost';
process.env.ES_PORT = '9200';

afterEach(() => {
  jest.clearAllMocks();
});
