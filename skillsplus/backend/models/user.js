import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        message: "Invalid email format",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Prevents password from being returned in queries by default
    },
    username: {
      type: String,
      unique: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9._-]+$/,
      sparse: true, // Allows multiple null values despite unique index
    },
    role: {
      type: String,
      enum: ["admin", "manager", "collaborator"],
      default: "collaborator",
    },
    jobPosition: {
      type: String,
      enum: [
        "fullStackDeveloper",
        "frontendDeveloper",
        "backendDeveloper",
        "unspecified",
      ],
      default: "unspecified",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "inactive",
    },
    clerkId: {
      type: String,
      sparse: true,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    discriminatorKey: '__t', // ⬅️ AJOUTER CETTE LIGNE
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password; // Always remove password from JSON output
        delete ret.__v; // Remove version key
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password; // Always remove password from Object output
        delete ret.__v; // Remove version key
        return ret;
      },
    },
  }
);

// Password hashing and username generation in a single pre-save hook
userSchema.pre("save", async function (next) {
  try {
    // Only hash the password if it's modified (or new)
    if (this.isModified("password")) {
      if (!this.password) {
        throw new Error("Password is required");
      }
      this.password = await bcrypt.hash(this.password, 10);
    }

    // Generate username if not provided
    if (!this.username && this.email) {
      let baseUsername = this.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "_");
      let username = baseUsername;
      let counter = 1;
      let existingUser;

      // Ensure username is unique
      do {
        existingUser = await mongoose.model("User").findOne({ username });
        if (existingUser && existingUser._id.toString() !== this._id.toString()) {
          username = `${baseUsername}_${counter}`;
          counter++;
        }
      } while (existingUser && existingUser._id.toString() !== this._id.toString());

      this.username = username;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for user's full profile URL (example)
userSchema.virtual("profileUrl").get(function () {
  return `/users/${this.username || this._id}`;
});

const User = mongoose.model("User", userSchema);

export default User;