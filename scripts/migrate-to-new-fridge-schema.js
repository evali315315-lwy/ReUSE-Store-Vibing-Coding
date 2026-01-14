import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'database', 'reuse-store.db');
const db = new Database(dbPath);

console.log('Migrating to new fridge schema...\n');

try {
  // Step 1: Rename old fridges table to fridge_companies
  console.log('Step 1: Renaming old fridges table to fridge_companies...');
  db.exec('ALTER TABLE fridges RENAME TO fridge_companies');
  console.log('✓ Renamed successfully\n');

  // Step 2: Update foreign key references in items table
  console.log('Step 2: Creating new items table with updated foreign key...');

  // Create new items table with correct foreign key
  db.exec(`
    CREATE TABLE items_new (
      id INTEGER PRIMARY KEY,
      checkout_id INTEGER NOT NULL,
      year_range TEXT NOT NULL,
      item_name TEXT NOT NULL,
      item_quantity INTEGER,
      verification_status TEXT,
      image_url TEXT,
      flagged BOOLEAN,
      verified_at DATETIME,
      verified_by TEXT,
      created_at DATETIME,
      description TEXT,
      fridge_company_id INTEGER,
      FOREIGN KEY (checkout_id) REFERENCES checkouts(id),
      FOREIGN KEY (fridge_company_id) REFERENCES fridge_companies(id)
    )
  `);

  // Copy data from old items table to new
  db.exec(`
    INSERT INTO items_new
    SELECT id, checkout_id, year_range, item_name, item_quantity,
           verification_status, image_url, flagged, verified_at, verified_by,
           created_at, description, fridge_id as fridge_company_id
    FROM items
  `);

  // Drop old items table and rename new one
  db.exec('DROP TABLE items');
  db.exec('ALTER TABLE items_new RENAME TO items');

  console.log('✓ Updated items table\n');

  // Step 3: Create new fridge inventory tables
  console.log('Step 3: Creating new fridge inventory tables...');

  const schemaPath = join(__dirname, '..', 'backend', 'src', 'db', 'fridge-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  db.exec(schema);
  console.log('✓ Created fridges and fridge_checkouts tables\n');

  // Step 4: Verify
  console.log('Step 4: Verifying tables...');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND (name LIKE '%fridge%' OR name = 'items')
    ORDER BY name
  `).all();

  console.log('Tables in database:');
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`  - ${table.name}: ${count.count} rows`);
  });

  console.log('\n✓ Migration complete!');
  console.log('\nOld "fridges" table renamed to "fridge_companies"');
  console.log('New "fridges" table created for inventory tracking');
  console.log('New "fridge_checkouts" table created for checkout tracking');

} catch (error) {
  console.error('\n✗ Migration failed:', error.message);
  console.error(error);
  process.exit(1);
}

db.close();
