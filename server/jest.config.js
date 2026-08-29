export default {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  testTimeout: 30000,
  // Each test file gets its own in-memory Mongo + fresh mongoose connection,
  // so keep runs sequential (--runInBand in the npm script) rather than
  // relying on Jest's default parallel workers.
  verbose: true,
};
