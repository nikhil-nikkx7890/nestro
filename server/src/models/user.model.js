import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },

    // select: false — Mongoose excludes this field from every query by
    // default (find, findById, etc.), so a stray console.log(user) or an
    // accidental API response never leaks a password hash. Routes that
    // genuinely need it (login) opt in explicitly with .select("+password").
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Email verification (ADR-063). Not select: false — unlike the
    // reset-flow fields below, this is meant to be read everywhere the
    // rest of the user object is (getMe, login, the account page banner),
    // not hidden by default. No token/expiry fields alongside it: the
    // verification link is a self-contained, purpose-scoped JWT
    // (generateEmailVerificationToken in utils/jwt.js), so there's
    // nothing to store or clear here — only this flag, flipped once.
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Password reset (ADR-062). Both select: false, same reasoning as
    // password above — a hash and an expiry timestamp for an in-flight
    // reset shouldn't leak through a stray query or response either.
    // Cleared (set to undefined) the moment the OTP is verified, so a
    // verified code can't be replayed — only the short-lived reset token
    // issued at that point carries the flow forward from there.
    passwordResetOTPHash: {
      type: String,
      select: false,
    },
    passwordResetOTPExpires: {
      type: Date,
      select: false,
    },

    // Passwordless OTP login (ADR-064). Deliberately separate fields
    // from passwordResetOTPHash/Expires above rather than reusing them —
    // sharing one hash across two purposes would recreate, at the field
    // level, exactly the cross-purpose confusion ADR-063 found and fixed
    // at the JWT level (a token/code proving one thing being accepted
    // for another): a leftover valid password-reset code could otherwise
    // log someone in outright, a stronger action than what that code was
    // ever meant to authorize. Same select: false and same single-use
    // clearing-on-verify as the reset fields.
    otpLoginHash: {
      type: String,
      select: false,
    },
    otpLoginExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

// Powers the admin Users list's search box. buildQueryFeatures' `search`
// param is a $text query, so without this index searching would silently
// match nothing at all.
userSchema.index({ name: "text", email: "text" });

// Hashes the password before saving — but only when it's actually new or
// changed. Without this check, saving a user for an unrelated reason
// (e.g. toggling isActive) would re-hash the already-hashed password,
// scrambling it and locking the user out.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Instance method — usable as `user.comparePassword("typedPassword")`.
// Needs the real hash, so callers must have fetched the user with
// .select("+password") first (see the login controller).
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
