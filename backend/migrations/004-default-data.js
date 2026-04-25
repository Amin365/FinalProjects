
// src/utils/defaultUsersAndRoles.js
import bcrypt from 'bcryptjs';
import RolePermission from '../models/RolePermission.js';
import User from '../models/user.js';
import UserPermission from '../models/UserPermission.js';

export const defaultUsersAndRoles = async () => {
  try {
    // -------------------------------
    // Role permissions mapping
    // -------------------------------
    const rolePermissions = [
      // Example: { role: 'SUPER_ADMIN_ROLE_OBJECT_ID', permissions: [/* array of Permission ObjectIds */] }
      // Fill this based on your roles and permission ObjectIds
    ];

    for (const { role, permissions } of rolePermissions) {
      for (const permission of permissions) {
        await RolePermission.findOneAndUpdate(
          { role, permission },
          { system: true, added_by: 1, role, permission },
          { upsert: true, new: true }
        );
      }
    }

    // -------------------------------
    // Default users
    // -------------------------------
    const users = [
      // Example:
      // {
      //   first_name: "Super",
      //   last_name: "Admin",
      //   username: "superadmin",
      //   password: "password123",
      //   email: "superadmin@example.com",
      //   role: "SUPER_ADMIN_ROLE_OBJECT_ID",
      //   warehouse: null
      // }
    ];

    for (const userData of users) {
      const { first_name, last_name, username, password, email, role, warehouse } = userData;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.findOneAndUpdate(
        { username },
        {
          first_name,
          middle_name,
          last_name,
          username,
          email,
          password: hashedPassword,
          role,
          warehouse_id: warehouse || null,
          confirmed: true,
          added_by: 1,
          updated_by: 1,
        },
        { upsert: true, new: true }
      );

      // Add permissions from role
      const rolePerm = rolePermissions.find(rp => rp.role.toString() === role.toString());
      if (rolePerm?.permissions?.length) {
        for (const permission of rolePerm.permissions) {
          await UserPermission.findOneAndUpdate(
            { user: user._id, permission },
            { user: user._id, permission, added_by: 1 },
            { upsert: true, new: true }
          );
        }
      }
    }

    console.log("Default users and role permissions initialized ✅");
  } catch (error) {
    console.error("Error initializing default users and roles:", error);
  }
};

// Default export to integrate with runMigrations
export default async function runDefaultUsersAndRoles() {
  await defaultUsersAndRoles();
}
