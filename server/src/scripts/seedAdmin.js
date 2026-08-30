import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/user.model.js";

/**
 * Creates the first admin account, if one doesn't already exist.
 *
 * Deliberately separate from seed.js (which wipes and reinserts Master
 * Data on every run) — this script never deletes anything, so it's safe
 * to run more than once. The second run (and every run after) just finds
 * the existing admin and exits without touching it.
 *
 * Reads credentials from .env if present (ADMIN_NAME, ADMIN_EMAIL,
 * ADMIN_PASSWORD), otherwise falls back to a known default so this works
 * out of the box in local dev — the console warning below is the
 * reminder to actually change it.
 */
const seedAdmin = async () => {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@nestro.com";
  const adminName = process.env.ADMIN_NAME || "Nestro Admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    console.log(`Admin account already exists for ${adminEmail} — nothing to do.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  // .create() runs the User model's pre("save") hook, so this password
  // is hashed exactly the same way a real register/login password would be.
  await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: "admin",
  });

  console.log(`Admin account created:`);
  console.log(`  email:    ${adminEmail}`);
  console.log(`  password: ${adminPassword}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(
      `\nWarning: using the default password because ADMIN_PASSWORD isn't set in .env. Log in and be aware this is not a secure long-term password.`,
    );
  }

  await mongoose.disconnect();
  process.exit(0);
};

seedAdmin().catch((error) => {
  console.error("Admin seeding failed:", error);
  process.exit(1);
});
