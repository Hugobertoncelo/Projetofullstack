import { beforeEach, jest } from "@jest/globals";

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Global test configuration
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = "test";
}
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
process.env.DATABASE_URL = "file:./test.db";
