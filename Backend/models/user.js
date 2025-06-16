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
    level: {
      type: String,
      enum: ["junior", "intermediate", "senior"],
      default: "junior",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "hello",
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
    },

    profileImage: {
      type: String, // URL de l'image (par défaut ou uploadée)
      default: function () {
        // Valeur par défaut en fonction du genre
        return this.gender === "female"
          ? "/images/default_female.png"
          : "/images/default_male.png";
      },
    },

    urls: [
      {
        label: {
          type: String,
          trim: true,
          maxlength: 50,
        },
        url: {
          type: String,
          trim: true,
          validate: {
            validator: (v) =>
              /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/.test(
                v
              ),
            message: "Invalid URL format",
          },
        },
      },
    ],

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
<<<<<<< HEAD
      enum: ["admin", "manager", "collaborator", "unspecified"],
      default: "unspecified",
    },
    jobPosition: {
      type: String,
=======
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
>>>>>>> origin/branch2
      default: "unspecified",
    },
    status: {
      type: String,
<<<<<<< HEAD
      enum: ["active", "inactive", "suspended", "blocked", "pending"],
      default: "pending",
=======
      enum: ["active", "inactive", "suspended"],
      default: "inactive",
>>>>>>> origin/branch2
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
<<<<<<< HEAD
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "__t", // Discriminator key for inheritance
=======
    assignedLevels: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    levelId: { type: mongoose.Schema.Types.ObjectId }
  }], // New field
  },
  {
    timestamps: true,
    discriminatorKey: '__t', // ⬅️ AJOUTER CETTE LIGNE
>>>>>>> origin/branch2
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
<<<<<<< HEAD
      let baseUsername = this.email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9.-]/g, "");
=======
      let baseUsername = this.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "_");
>>>>>>> origin/branch2
      let username = baseUsername;
      let counter = 1;
      let existingUser;

      // Ensure username is unique
      do {
        existingUser = await mongoose.model("User").findOne({ username });
<<<<<<< HEAD
        if (
          existingUser &&
          existingUser._id.toString() !== this._id.toString()
        ) {
          username = `${baseUsername}_${counter}`;
          counter++;
        }
      } while (
        existingUser &&
        existingUser._id.toString() !== this._id.toString()
      );
=======
        if (existingUser && existingUser._id.toString() !== this._id.toString()) {
          username = `${baseUsername}_${counter}`;
          counter++;
        }
      } while (existingUser && existingUser._id.toString() !== this._id.toString());
>>>>>>> origin/branch2

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

<<<<<<< HEAD
// Virtual for user's full profile URL
=======
// Virtual for user's full profile URL (example)
>>>>>>> origin/branch2
userSchema.virtual("profileUrl").get(function () {
  return `/users/${this.username || this._id}`;
});

const User = mongoose.model("User", userSchema);

<<<<<<< HEAD
export default User;
=======
export default User;
>>>>>>> origin/branch2
