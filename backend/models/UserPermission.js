import mongoose from "mongoose";

const UserPermissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    permission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// 🔒 Prevent duplicate user-permission pairs
UserPermissionSchema.index({ user: 1, permission: 1 }, { unique: true });

// 🔗 Optional virtuals (for populating in User model)
UserPermissionSchema.virtual("permissionDetails", {
  ref: "Permission",
  localField: "permission",
  foreignField: "_id",
  justOne: true,
});

UserPermissionSchema.virtual("userDetails", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: true,
});

const UserPermission = mongoose.model(
  "UserPermission",
  UserPermissionSchema
);

export default UserPermission;
