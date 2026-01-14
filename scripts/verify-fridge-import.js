import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'database', 'reuse-store.db');
const db = new Database(dbPath);

console.log('Verifying fridge data import...\n');

// Count total fridges
const fridgeCount = db.prepare('SELECT COUNT(*) as count FROM fridges').get();
console.log(`Total fridges in database: ${fridgeCount.count}`);

// Count by status
const statusCounts = db.prepare(`
  SELECT status, COUNT(*) as count
  FROM fridges
  GROUP BY status
`).all();

console.log('\nFridges by status:');
statusCounts.forEach(row => {
  console.log(`  - ${row.status}: ${row.count}`);
});

// Count checkouts
const checkoutCount = db.prepare('SELECT COUNT(*) as count FROM fridge_checkouts').get();
console.log(`\nTotal checkouts: ${checkoutCount.count}`);

// Sample some checked out fridges
const sampleCheckouts = db.prepare(`
  SELECT
    f.fridge_number,
    f.brand,
    f.size,
    fc.student_name,
    fc.student_email,
    fc.checkout_date
  FROM fridges f
  JOIN fridge_checkouts fc ON f.id = fc.fridge_id
  LIMIT 5
`).all();

console.log('\nSample checkout records:');
sampleCheckouts.forEach(row => {
  console.log(`  - Fridge #${row.fridge_number} (${row.brand} - ${row.size})`);
  console.log(`    Checked out to: ${row.student_name} (${row.student_email})`);
  console.log(`    Date: ${row.checkout_date}`);
});

console.log('\n✓ Data verification complete!');

db.close();
