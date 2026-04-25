// src/utils/statePermissions.js
import Permission from '../models/Permissions.js';
import RolePermission from '../models/RolePermission.js';
import UserPermission from '../models/UserPermission.js';
import Role from '../models/Role.js';
import User from '../models/user.js';

export const statePermissions = async () => {
  try {
    // This migration previously assumed numeric permission IDs (209-300) and numeric role/user IDs (1),
    // which do not exist in the current schema. To avoid inserting bad references, we now no-op until
    // concrete permissions/roles are defined.
    const superAdminRole = await Role.findOne({ role: "Super Admin" });
    const superAdminUser = await User.findOne({ username: "superadmin" });

    if (!superAdminRole || !superAdminUser) {
      console.log("Skipping statePermissions: Super Admin role/user missing. Define them before enabling this migration.");
      return;
    }

    // If you add state-specific permissions later, implement them here using real ObjectIds.
    console.log("No state permissions to seed; skipping.");
  } catch (error) {
    console.error("Error initializing state permissions:", error);
  }
};

// Default export so runMigrations executes this file safely
export default async function runStatePermissions() {
  await statePermissions();
}
