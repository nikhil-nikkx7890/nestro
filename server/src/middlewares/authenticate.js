import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";

/**
 * Confirms the request carries a valid, unexpired JWT (from the httpOnly
 * cookie) and that the user it points to still exists and is active.
 * On success, attaches the full user document to req.user for downstream
 * middleware/controllers (see authorize.js, which reads req.user.role).
 */
export const authenticate = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new AppError("You are not logged in. Please log in to continue.", 401);
  }

  // jwt.verify throws on both an invalid signature and an expired token.
  // Caught explicitly (rather than left to the global errorHandler) so the
  // client gets a clean 401 with a clear message, instead of a generic
  // 500 — the raw JsonWebTokenError isn't an AppError, so errorHandler
  // would otherwise treat it as an unexpected server error.
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError("Invalid or expired session. Please log in again.", 401);
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError("The user for this session no longer exists.", 401);
  }
  if (!user.isActive) {
    throw new AppError("This account has been deactivated.", 403);
  }

  req.user = user;
  next();
};
