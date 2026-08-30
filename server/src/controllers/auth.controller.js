import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { generateToken } from "../utils/jwt.js";
import { authCookieOptions } from "../utils/authCookie.js";

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
  if (!user || !(await user.comparePassword(password))) {
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
