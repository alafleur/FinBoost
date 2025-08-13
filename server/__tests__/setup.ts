/**
 * STEP 8: Jest Test Setup
 * 
 * Global test configuration and setup for all test suites
 */

import '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/finboost_test';

export {};