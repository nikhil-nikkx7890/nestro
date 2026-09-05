import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { generateToken } from "../utils/jwt.js";
import { authCookieOptions } from "../utils/authCookie.js";

/**
 * A real bcrypt hash of a value nothing can log in with, compared against
 * when no user matches so that both branches of login pay the same cost
 * (ADR-058). Generated at cost 10, matching user.model.js's pre-save hook —
 * a cheaper hash here would leave a smaller but still measurable gap.
 *
 * Hardcoded rather than hashed at boot: it must be a constant so the work
 * is identical on every request, and it is not a credential — no account
 * has this hash, and comparing against it always fails.
 */
const DUMMY_PASSWORD_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

/**
 * Publicly self-registers a new account. Always creates role: "customer" —
 * a public endpoint must never let the caller choose their own role, or
 * anyone could POST role: "admin" and grant themselves full access.
 * Admin accounts are created separately (seed script or by an existing
 * admin), never through this route.
 */
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const user = await User.create({ name, email, password, role: "customer" });

  const token = generateToken(user._id);
  res.cookie("token", token, authCookieOptions);

  return res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // .select("+password") is required — the schema excludes password by
  // default (see user.model.js), so without this the hash wouldn't be on
  // the returned document and comparePassword would have nothing to compare against.
  const user = await User.findOne({ email }).select("+password");

  // Deliberately the same error message whether the email doesn't exist
  // or the password is wrong — a different message for each would let an
  // attacker enumerate which emails have accounts.
  //
  // The message alone wasn't enough. `!user || !(await user.compare...)`
  // short-circuits, so an unknown email skipped bcrypt entirely and
  // returned ~16x faster than a known one — the constant message defeated
  // by non-constant time (ADR-058). Comparing against a fixed dummy hash
  // on the no-user path makes both branches do the same work.
  const passwordMatches = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account has been deactivated.", 403);
  }

  const token = generateToken(user._id);
  res.cookie("token", token, authCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const logout = async (req, res) => {
  // clearCookie needs the same httpOnly/secure/sameSite options used when
  // the cookie was set, or the browser won't recognize it as the same
  // cookie and won't remove it.
  res.clearCookie("token", authCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * Returns the currently logged-in user. Relies entirely on the
 * authenticate middleware having already run and attached req.user —
 * this controller does no lookup of its own.
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

/**
 * Updates the logged-in user's own name. req.user comes from the
 * authenticate middleware, so there's no id in the route — a caller can
 * only ever edit themselves, never another user.
 */
export const updateMe = async (req, res) => {
  const { name } = req.body;

  req.user.name = name;
  await req.user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};
