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
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

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
app.use("/api/cart", cartRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Nestro backend api is running successfully....",
  });
});

app.use(errorHandler);

export default app;
