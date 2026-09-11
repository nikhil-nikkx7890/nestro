import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import categoryRoutes from "./routes/category.routes.js";
import roomTypeRoutes from "./routes/roomType.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import materialRoutes from "./routes/material.routes.js";
import colorRoutes from "./routes/color.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import productRoutes from "./routes/product.routes.js";
import productVariantRoutes from "./routes/productVariant.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import addressRoutes from "./routes/address.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import orderRoutes from "./routes/order.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { verifyOrigin } from "./middlewares/verifyOrigin.js";

const app = express();

/**
 * Without this, every request reports a proxy's address as req.ip and
 * express-rate-limit buckets accordingly — the general limiter gets
 * consumed collectively, and the stricter auth limiter inverts into a
 * denial of service where twenty failed logins lock out everyone
 * (ADR-058).
 *
 * There are TWO hops in front of this app, not one: Cloudflare, then
 * Render's own router. Production responses carry both — `Server:
 * cloudflare` and a `CF-RAY` header from the edge, plus Render's own
 * `rndr-id` — for the whole time this went unnoticed. ADR-058 set `1`,
 * reasoning about "the platform proxy" as a single hop and stopping there;
 * that undercounted by one, so `req.ip` resolved to the Cloudflare edge
 * address instead of the client. One Cloudflare colo answers from many
 * edge IPs, so that collapsed many distinct clients onto a handful of
 * shared buckets — better than ADR-058's original single global bucket,
 * but still not per-client (ADR-060).
 *
 * `2`, not `true`: trust exactly two hops. `true` trusts a client-supplied
 * X-Forwarded-For with no limit, which would let a caller mint a fresh
 * rate-limit key per request and remove the limit entirely.
 *
 * This number encodes a fact about the deployment chain, not about the
 * code — it has to be re-measured from response headers, not inferred
 * from a diagram, if that chain ever changes (another CDN in front,
 * Cloudflare removed, a second load balancer). A `CF-Connecting-IP`
 * keyGenerator was considered and rejected for the same reason: it would
 * fix the limiter but leave req.ip wrong everywhere else that reads it,
 * including the request logging this app doesn't have yet (ADR-060).
 *
 * Must be set before the limiters are mounted below.
 */
app.set("trust proxy", 2);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(verifyOrigin(allowedOrigins));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/room-types", roomTypeRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api", productVariantRoutes);
app.use("/api", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Nestro backend api is running successfully....",
  });
});

app.use(errorHandler);

export default app;
