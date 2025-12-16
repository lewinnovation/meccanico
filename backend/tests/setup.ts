// Jest test setup file
import 'reflect-metadata';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRATION = '1h';

// SMTP config for tests (only set if not already configured)
// Use environment variables or test credentials - never commit real credentials
if (!process.env.SMTP_HOST) {
  process.env.SMTP_HOST = process.env.TEST_SMTP_HOST || 'smtp.example.com';
  process.env.SMTP_PORT = process.env.TEST_SMTP_PORT || '2525';
  process.env.SMTP_USER = process.env.TEST_SMTP_USER || 'test@example.com';
  process.env.SMTP_PASS = process.env.TEST_SMTP_PASS || 'test-password';
  process.env.SMTP_FROM = process.env.TEST_SMTP_FROM || 'test@example.com';
  process.env.SMTP_SECURE = process.env.TEST_SMTP_SECURE || 'false';
  process.env.SMTP_REQUIRE_TLS = process.env.TEST_SMTP_REQUIRE_TLS || 'true';
}

// Increase timeout for async tests
jest.setTimeout(10000);

// Global test utilities
beforeAll(() => {
  // Setup that runs once before all tests
});

afterAll(() => {
  // Cleanup that runs once after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

