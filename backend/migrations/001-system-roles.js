// src/utils/systemRoles.js
import Role from "../models/Role.js";
import User from "../models/user.js";

export const systemRoles = async () => {
  try {
    // Define the roles
    const rolesData = [
      { role: "Super Admin", plural: "Super Admins", system: true, color: "#6366f1" },
      { role: "Admin", plural: "Admins", system: true, color: "#6366f1" },
      { role: "Library Staff", plural: "Library Staff", system: true, color: "#4f46e5", parent: null },
      { role: "Student", plural: "Students", system: true, color: "#10b981", parent: null },
     
      { role: "Volunteer", plural: "Volunteer", system: true, color: "#10b971", parent: null },
     

    ];

    // Insert or update roles
    const createdRoles = [];
    for (const roleData of rolesData) {
      const role = await Role.findOneAndUpdate(
        { role: roleData.role }, // check by role name
        roleData,
        { upsert: true, new: true } // create if not exists
      );
      createdRoles.push(role);
    }

    // Assign Super Admin role to first user
    const user = await User.findOne({ username: "superadmin" }); // or some criteria
    if (user) {
      const superAdminRole = createdRoles.find(r => r.role === "Super Admin");
      user.role = superAdminRole._id; // assign ObjectId
      await user.save();
    }

    console.log("System roles initialized ✅");
  } catch (error) {
    console.error("Error initializing system roles:", error);
  }
};

// Default export so runMigrations can pick it up
export default async function runSystemRoles() {
  await systemRoles();
}
