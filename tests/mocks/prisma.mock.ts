/**
 * Prisma Mock Client
 * Provides a deep mock of PrismaClient for isolated unit testing
 */

import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Create and export the mock
export const prismaMock = mockDeep<PrismaClient>();

// Helper type for the mocked Prisma client
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

// Re-export for convenience
export { mockDeep, mockReset } from 'jest-mock-extended';
