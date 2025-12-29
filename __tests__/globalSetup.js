/**
 * Global Setup for Jest Tests
 * Runs once before all test suites
 */

module.exports = async () => {
  console.log('\n🚀 Starting test suite...\n');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TZ = 'UTC';
  
  // You can add global setup here like:
  // - Starting test database
  // - Setting up test fixtures
  // - Initializing mock services
};
