/**
 * STEP 10: Jest Configuration for Comprehensive Testing
 * 
 * Configures Jest for testing both unit and integration tests
 * with proper TypeScript support and mocking capabilities
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapping: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@/(.*)$': '<rootDir>/server/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.ts'],
  collectCoverageFrom: [
    'server/**/*.ts',
    '!server/**/*.test.ts',
    '!server/__tests__/**',
    '!server/db.ts', // Database connection file
    '!server/index.ts' // Server entry point
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000, // 30 seconds for integration tests
  maxWorkers: 1, // Prevent database conflicts
  verbose: true,
  bail: false, // Continue running tests even if some fail
  errorOnDeprecated: true,
  detectOpenHandles: true,
  forceExit: true
};