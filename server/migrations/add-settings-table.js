import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runMigration() {
  const dbPath = path.join(__dirname, '../../database/reuse-store.db');
  const db = new Database(dbPath);

  console.log('Running migration: add-settings-table');

  try {
    // Create settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        category TEXT,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT
      );
    `);

    console.log('Settings table created successfully');

    // Check if settings already exist
    const existingSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get();

    if (existingSettings.count === 0) {
      // Seed initial settings with current hardcoded values from AboutContent.jsx
      const initialSettings = [
        {
          key: 'hours',
          value: JSON.stringify({
            Tuesday: '3:00 PM - 5:00 PM',
            Friday: '1:00 PM - 3:00 PM',
            Saturday: '9:00 AM - 11:00 AM'
          }),
          category: 'hours',
          description: 'ReUSE Store operating hours',
          updated_by: 'system'
        },
        {
          key: 'location',
          value: JSON.stringify({
            building: 'Comfort Hall, Basement',
            street: '370 Lancaster Avenue',
            city: 'Haverford',
            state: 'PA',
            zip: '19041'
          }),
          category: 'location',
          description: 'ReUSE Store physical location',
          updated_by: 'system'
        },
        {
          key: 'contact_email',
          value: JSON.stringify('reuse@haverford.edu'),
          category: 'contact',
          description: 'ReUSE Store contact email',
          updated_by: 'system'
        },
        {
          key: 'contact_phone',
          value: JSON.stringify('(610) 896-1000'),
          category: 'contact',
          description: 'ReUSE Store contact phone',
          updated_by: 'system'
        }
      ];

      const insertStmt = db.prepare(`
        INSERT INTO settings (key, value, category, description, updated_by)
        VALUES (@key, @value, @category, @description, @updated_by)
      `);

      for (const setting of initialSettings) {
        insertStmt.run(setting);
      }

      console.log('Initial settings seeded successfully');
    } else {
      console.log('Settings already exist, skipping seed');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export default runMigration;
