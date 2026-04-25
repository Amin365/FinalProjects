import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedAllModules = async () => {
  try {
    const seedFiles = fs
      .readdirSync(__dirname)
      .filter(file => file !== "index.js" && file.endsWith(".js"))
      .sort();

    for (const file of seedFiles) {
      const fullPath = path.join(__dirname, file);

     
      const fileUrl = pathToFileURL(fullPath).href;

      const module = await import(fileUrl);
      const seedFunction = module.default;

      if (typeof seedFunction === "function") {
        await seedFunction();
      }
    }

    console.log("✅ All modules seeding completed.");
  } catch (error) {
    console.error("❌ Error seeding all modules:", error);
  }
};

export default seedAllModules;
