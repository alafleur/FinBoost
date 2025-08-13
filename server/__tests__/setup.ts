/**
 * STEP 10: Jest Test Setup
 * 
 * Global test configuration and setup for all test suites
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console.log to reduce noise during tests (but keep errors)
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// Global test helpers
global.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/finboost_test';

// Global error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export {};