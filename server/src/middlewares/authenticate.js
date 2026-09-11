import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { verifyLoginToken } from "../utils/jwt.js";

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

  // verifyLoginToken throws on an invalid signature, an expired token,
  // AND a well-formed reset/email-verification token (ADR-063) — any of
  // those is caught here the same way, since the client's response is
  // identical either way: not currently logged in.
  let decoded;
  try {
    decoded = verifyLoginToken(token);
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
