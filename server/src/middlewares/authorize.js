import AppError from "../utils/AppError.js";

/**
 * Middleware factory — same pattern as validateObjectId(paramName).
 * Usage: router.delete("/:id", authenticate, authorize("admin"), deleteX)
 *
 * Must run AFTER authenticate, since it reads req.user which authenticate
 * sets. Takes one or more allowed roles so it can be reused as
 * authorize("admin") or, later, authorize("admin", "superAdmin").
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("You do not have permission to perform this action.", 403);
    }
    next();
  };
};
