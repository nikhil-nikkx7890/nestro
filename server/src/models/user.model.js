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
  },
  {
    timestamps: true,
  },
);

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
