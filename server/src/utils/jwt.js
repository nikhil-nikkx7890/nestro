import jwt from "jsonwebtoken";

/**
 * Signs a new JWT containing only the user's id. Kept minimal on purpose —
 * role and other details are fetched fresh from the database on every
 * request (see authenticate.js), so a role change takes effect immediately
 * instead of waiting for the old token to expire.
 */
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
