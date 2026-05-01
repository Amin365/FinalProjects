import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  try {
    const migrationsDir = __dirname;

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file !== 'index.js' && path.extname(file) === '.js')
      .sort(); // ensure deterministic order: 001, 002, ...

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);

      // Convert Windows path to file:// URL
      const fileUrl = pathToFileURL(filePath).href;

      const migrationModule = await import(fileUrl);

      if (migrationModule.default) {
        await migrationModule.default();
      } else if (typeof migrationModule.run === 'function') {
        await migrationModule.run();
      }
    }

    console.log('All migrations ran successfully ');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
};
