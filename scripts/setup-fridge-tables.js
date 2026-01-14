import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const dbPath = join(__dirname, '..', 'database', 'reuse-store.db');
const db = new Database(dbPath);

console.log('Setting up fridge tables in database...\n');
console.log(`Database path: ${dbPath}\n`);

// Read the schema file
const schemaPath = join(__dirname, '..', 'backend', 'src', 'db', 'fridge-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

// Execute the schema
try {
  db.exec(schema);
  console.log('✓ Fridge tables created successfully!\n');

  // Verify tables were created
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name LIKE 'fridge%'
    ORDER BY name
  `).all();

  console.log('Tables created:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
} catch (error) {
  console.error('Error creating tables:', error.message);
  process.exit(1);
}

db.close();
console.log('\n✓ Database setup complete!');
