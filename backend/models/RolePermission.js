
import mongoose from "mongoose";

const RolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    permission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },

    system: {
      type: Boolean,
      default: false,
    },

    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

// prevent duplicate role-permission pairs
RolePermissionSchema.index(
  { role: 1, permission: 1 },
  { unique: true }
);

const RolePermission = mongoose.model(
  "RolePermission",
  RolePermissionSchema
);

export default RolePermission;
