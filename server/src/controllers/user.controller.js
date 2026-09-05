import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";

/**
 * Admin-only user directory. Read plus one write — activate/deactivate —
 * and deliberately nothing else:
 *
 * - No role editing. Promoting a customer to admin is Super Admin
 *   territory, which ADR-002's delayed-refactoring rule keeps deferred
 *   until there's a real second-admin scenario. An admin who could
 *   promote anyone (including themselves) is effectively a Super Admin
 *   with none of the thinking that role needs.
 * - No password reset from here. That needs email infrastructure, which
 *   the project doesn't have yet.
 * - No user deletion. A User is referenced by Cart, Wishlist and Review;
 *   deleting one would orphan those records, and deactivation already
 *   covers the real need (stop this person signing in).
 */
export const getUsers = async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
    sortableFields: ["name", "email", "createdAt", "role"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  // buildQueryFeatures already handles `isActive`; role is specific to
  // this resource, so it's applied here.
  const { role } = req.query;
  if (role === "admin" || role === "customer") {
    filter.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { isActive } = req.body;

  // Deactivating yourself locks you out of the panel you'd need to undo
  // it — the request is refused rather than "helpfully" logging you out.
  if (String(req.user._id) === String(userId)) {
    throw new AppError("You can't change your own account status.", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  // Deactivating the last active admin would leave nobody able to sign
  // in and re-activate anyone — an unrecoverable state without direct
  // database access.
  if (user.role === "admin" && isActive === false) {
    const activeAdmins = await User.countDocuments({ role: "admin", isActive: true });
    if (activeAdmins <= 1) {
      throw new AppError("This is the last active admin — deactivating it would lock everyone out.", 400);
    }
  }

  user.isActive = isActive;
  await user.save();

  return res.status(200).json({
    success: true,
    message: isActive ? "Account activated." : "Account deactivated.",
    data: user,
  });
};
