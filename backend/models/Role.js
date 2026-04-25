import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,  // Prevent duplicate role names
      trim: true,
      default: "",
    },

    plural: {
      type: String,
      default: "",
      trim: true,
    },

    color: {
      type: String,
      default: "#00000000",
      maxlength: 10,
    },

    system: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
);

// 🔗 Virtual for Role → Users (1-to-Many)
RoleSchema.virtual("users", {
  ref: "User",           // Model to populate
  localField: "_id",     // Field in Role
  foreignField: "role",  // Field in User
});

// 🔗 Virtual for Role → Permissions (Many-to-Many)
RoleSchema.virtual("permissions", {
  ref: "RolePermission",  // Join collection
  localField: "_id",       // Role._id
  foreignField: "role",    // RolePermission.role
});

// Enable virtuals in JSON
RoleSchema.set("toObject", { virtuals: true });
RoleSchema.set("toJSON", { virtuals: true });

const Role = mongoose.model("Role", RoleSchema);

export default Role;
