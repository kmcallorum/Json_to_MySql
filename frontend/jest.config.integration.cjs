const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['**/*.integration.test.(ts|tsx)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
  ],
  testTimeout: 10000,
};
