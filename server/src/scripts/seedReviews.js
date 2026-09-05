import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

/**
 * Seeds demo customer accounts and the reviews they wrote.
 *
 * These are demo data in exactly the way the seeded catalog is: the
 * ratings the storefront shows are genuinely computed from these Review
 * documents by the same aggregation a real review would feed. That's the
 * line the ADR refining ADR-041 draws — a working review system with
 * seeded content is fine; a hardcoded "4.8/5" in the markup is not. The
 * footer's demo notice tells visitors which side of that line the site
 * is on.
 *
 * Idempotent: skips any product that already has reviews, and reuses
 * demo accounts rather than recreating them.
 */
const DEMO_CUSTOMERS = [
  { name: "Priya Rao", email: "priya.demo@nestro.test" },
  { name: "Arjun Sharma", email: "arjun.demo@nestro.test" },
  { name: "Neha Kapoor", email: "neha.demo@nestro.test" },
  { name: "Rohit Menon", email: "rohit.demo@nestro.test" },
  { name: "Ananya Iyer", email: "ananya.demo@nestro.test" },
  { name: "Vikram Desai", email: "vikram.demo@nestro.test" },
];

const DEMO_PASSWORD = "demopassword123";

// Written per rating band so the comment matches the stars — a 2-star
// review paired with glowing text is the kind of detail that makes
// seeded content read as obviously fake.
const COMMENTS = {
  5: [
    "Exactly what the listing described. Solid, heavy, and the finish is even all over.",
    "Better in person than in the photos. Assembly took twenty minutes.",
    "Two months in and it still looks new. No wobble, no creaking.",
    "The dimensions were spot on, which made planning the room easy.",
  ],
  4: [
    "Really happy with it overall — one corner had a small scuff, but nothing structural.",
    "Good quality for the price. Packaging could have been sturdier.",
    "Looks great and feels sturdy. Took longer to assemble than I expected.",
    "Comfortable and well built. The colour is slightly darker than the photos.",
  ],
  3: [
    "Does the job, but the finish is uneven in a couple of spots.",
    "Fine for the price. Not something I'd call premium.",
    "Sturdy enough, though one panel didn't line up perfectly.",
  ],
  2: [
    "Arrived with a scratch on the top surface and a missing screw.",
    "The build feels lighter than I expected for the price.",
  ],
  1: [
    "One leg was cracked on arrival and the finish had already chipped.",
  ],
};

// Weighted towards positive, but not uniformly — a catalog where every
// product sits at 5.0 is as unconvincing as invented testimonials.
const RATING_WEIGHTS = [5, 5, 5, 5, 4, 4, 4, 3, 3, 2, 1];

const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const seedReviews = async () => {
  await connectDB();

  // Reuse existing demo accounts so re-running doesn't fail on the
  // unique email index or pile up duplicates.
  const customers = [];
  for (const demo of DEMO_CUSTOMERS) {
    let user = await User.findOne({ email: demo.email });
    if (!user) {
      user = await User.create({ ...demo, password: DEMO_PASSWORD, role: "customer" });
      console.log(`Created demo customer: ${demo.name}`);
    }
    customers.push(user);
  }

  const products = await Product.find({ status: "published" }).select("_id name");
  console.log(`Published products: ${products.length}`);

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    if (await Review.exists({ product: product._id })) {
      skipped++;
      continue;
    }

    // Not every product gets reviews — a brand new catalog entry with
    // zero reviews is realistic, and it exercises the "no reviews yet"
    // empty state on the product page.
    if (Math.random() < 0.2) continue;

    const reviewerCount = randomInt(1, Math.min(4, customers.length));
    const reviewers = [...customers].sort(() => Math.random() - 0.5).slice(0, reviewerCount);

    for (const reviewer of reviewers) {
      const rating = pickOne(RATING_WEIGHTS);
      await Review.create({
        product: product._id,
        user: reviewer._id,
        rating,
        comment: pickOne(COMMENTS[rating]),
        createdAt: daysAgo(randomInt(1, 120)),
      });
      created++;
    }
  }

  console.log(`\nCreated ${created} reviews.`);
  console.log(`Skipped ${skipped} products that already had reviews.`);
  console.log(`Demo customer login: ${DEMO_CUSTOMERS[0].email} / ${DEMO_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
};

seedReviews().catch((error) => {
  console.error("Review seeding failed:", error);
  process.exit(1);
});
