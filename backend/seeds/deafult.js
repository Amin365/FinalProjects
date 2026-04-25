import { runMigrations } from "../migrations/index.js";
import { mainPermissions } from "../migrations/002-main-permissions.js";
import Role from "../models/Role.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";




async function MigrateDefaults() {
  try {
    // Always run migrations so base data is present
    await runMigrations();
    console.log('Migrations ran successfully');

    // Ensure Super Admin role exists
    const superAdminRole = await Role.findOne({ role: "Super Admin" });

    // Upsert a superadmin user and attach the role
    const password = "aminbashir07";
    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdminUser = await User.findOneAndUpdate(
      { username: "superadmin" },
      {
        first_name: "Amin",
        middle_name: "Bashir",
        last_name: "Husein",
        username: "aminbashir07",
        email: "aminbashir07@example.com",
        password: hashedPassword,
        role: superAdminRole?._id || null,
        confirmed: true,
      },
      { upsert: true, new: true }
    );

    if (superAdminRole && superAdminUser.role?.toString() !== superAdminRole._id.toString()) {
      superAdminUser.role = superAdminRole._id;
      await superAdminUser.save();
    }

    // Re-run permission assignment now that user exists
    await mainPermissions();

    console.log('✅ Default superadmin ensured');

  
  } catch (error) {
    console.error("❌ Error creating default user:", error);
  }
}

export default MigrateDefaults;
