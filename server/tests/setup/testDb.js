import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Spins up a fresh, in-memory MongoDB instance for the current test file
 * and connects mongoose to it. Nothing here ever touches the real
 * Atlas database — this is a throwaway DB that only exists in RAM for
 * the lifetime of this test run.
 *
 * Usage in a test file:
 *   beforeAll(() => connectTestDB());
 *   afterEach(() => clearTestDB());
 *   afterAll(() => disconnectTestDB());
 */

let mongoServer;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

// Wipes every collection between tests so one test's data never leaks
// into the next (e.g. a "Category" created in test A shouldn't make a
// duplicate-name check in test B pass or fail unexpectedly).
export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

export const disconnectTestDB = async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
};
