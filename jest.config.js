const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  
  // Test environment
  testEnvironment: 'node',
  
  // Module path aliases (matching tsconfig paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/services/**/*.ts',
    '!src/**/*.d.ts',
  ],
  
  // Coverage thresholds (lowered for initial setup)
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  
  // Coverage output directory and reporters
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],
  
  // Test reporters for JSON/HTML output
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Laporan Pengujian Whitebox - E-Learning Platform',
      outputPath: '<rootDir>/test-reports/test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
    }],
  ],
  
  // JSON output configuration
  testResultsProcessor: undefined,
  
  // Transform settings
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
};

module.exports = createJestConfig(customJestConfig);

