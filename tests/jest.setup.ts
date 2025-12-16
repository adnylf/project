/**
 * Jest Setup File
 * This file runs before all tests and sets up global mocks
 */

import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Import the prisma instance
import prisma from '@/lib/prisma';

// Create a mock of Prisma Client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// Export the mocked prisma for use in tests
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Extend Jest matchers (optional - for custom assertions)
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Suppress console.log during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
