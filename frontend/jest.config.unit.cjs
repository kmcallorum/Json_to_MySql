const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  displayName: 'unit',
  testMatch: [
    '**/*.test.(ts|tsx)',
    '!**/*.integration.test.(ts|tsx)',
    '!**/*.a11y.test.(ts|tsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
  ],
};
