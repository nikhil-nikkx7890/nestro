import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Same JWT-cookie check as authenticate.js, but never throws — a missing
 * cookie, an invalid/expired token, or a deactivated user all just fall
 * through as an anonymous request (req.user left unset) instead of a 401.
 * Lets one route serve both an authenticated admin (full visibility) and
 * an anonymous storefront caller (restricted visibility) without a
 * parallel route tree (ADR-036).
 */
export const optionalAuthenticate = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (user && user.isActive) {
      req.user = user;
    }
  } catch (err) {
    // Invalid or expired token — proceed as anonymous rather than throw.
  }

  next();
};
