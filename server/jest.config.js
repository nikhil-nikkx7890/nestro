export default {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  testTimeout: 30000,
  // Sets dummy env vars (JWT_SECRET etc.) before any test file — and
  // therefore before app.js — is imported. See tests/setup/env.js.
  setupFiles: ["<rootDir>/tests/setup/env.js"],
  // Each test file gets its own in-memory Mongo + fresh mongoose connection,
  // so keep runs sequential (--runInBand in the npm script) rather than
  // relying on Jest's default parallel workers.
  verbose: true,
};
