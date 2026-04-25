import mongoose from "mongoose";

const PermissionSchema = new mongoose.Schema(
  {
    permission: {
      type: String,
      required: true,
      unique: true,          // 🔒 prevent duplicates
      trim: true,
      lowercase: true,       // 🧼 normalize
      default: "",
    },

    grouped_under: {
      type: String,
      default: null,
      trim: true,
    },

    subgroup_string: {
      type: String,
      default: null,
      trim: true,
    },

    system: {
      type: Boolean,
      default: false,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PermissionCategory",
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

// 📌 Indexes for performance
PermissionSchema.index({ category: 1 });
PermissionSchema.index({ grouped_under: 1 });

const Permission = mongoose.model("Permission", PermissionSchema);

export default Permission;
