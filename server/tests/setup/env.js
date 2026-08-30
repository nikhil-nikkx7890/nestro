// Runs before any test file, before app.js (and therefore jwt.js) is even
// imported. JWT signing genuinely needs process.env.JWT_SECRET at runtime —
// unlike Cloudinary config (which only fails when actually called), a
// missing JWT_SECRET breaks immediately the first time a token is signed.
// This is a dummy value, never used outside this test process.
process.env.JWT_SECRET = "test-only-secret-do-not-use-in-production-1234567890";
process.env.JWT_EXPIRES_IN = "1h";
