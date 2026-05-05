import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    middle_name: { type: String, trim: true },
    last_name: { type: String, required: true, trim: true },

    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },

    password: { type: String, required: true },

    // ✅ Keep this (safe now)
    member_id: { type: String, unique: true, trim: true },

    status: {
      type: String,
      enum: ["Active", "Inactive", "pending"],
      default: "Active",
    },

    Bio: { type: String },
    profile_picture: { type: String, default: "" },

    // Role
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: false,
    },

    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resetPasswordCode: String,
    resetPasswordExpires: Date,

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    inviteToken: {
      type: String,
      index: true,
    },

    inviteTokenExpires: Date,

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    invitedAt: Date,

    lastPasswordChange: Date,

    passwordChangedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// 🔒 Password hashing
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  this.lastPasswordChange = new Date();

  if (!this.isNew) {
    this.passwordChangedCount = (this.passwordChangedCount || 0) + 1;
  }
});

// ✅ Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual permissions
userSchema.virtual("permissions", {
  ref: "UserPermission",
  localField: "_id",
  foreignField: "user",
});

// Enable virtuals
userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;``