import Database from 'better-sqlite3';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_PATH = path.join(__dirname, '../database/reuse-store.db');

// CSV file path
const CSV_FILE = path.join(__dirname, '../Copy of 2025 - 2026 (RE)use Store Inventory - Detailed Check-out.csv');

// Create database directory if it doesn't exist
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
console.log('📦 Database initialized at:', DB_PATH);

// Create tables
function createTables() {
  console.log('🏗️  Creating tables...');

  // Checkouts table - stores main checkout session info
  db.exec(`
    CREATE TABLE IF NOT EXISTS checkouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      email TEXT NOT NULL,
      housing_assignment TEXT,
      graduation_year TEXT,
      total_items INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Items table - stores individual items (separated from comma-separated list)
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkout_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      item_quantity INTEGER DEFAULT 1,
      verification_status TEXT DEFAULT 'pending',
      image_url TEXT,
      flagged BOOLEAN DEFAULT 0,
      verified_at DATETIME,
      verified_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (checkout_id) REFERENCES checkouts(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_checkouts_email ON checkouts(email);
    CREATE INDEX IF NOT EXISTS idx_checkouts_date ON checkouts(date);
    CREATE INDEX IF NOT EXISTS idx_items_checkout_id ON items(checkout_id);
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(verification_status);
  `);

  console.log('✅ Tables created successfully');
}

// Parse item string and extract individual items with quantities
function parseItems(itemsString) {
  if (!itemsString || itemsString.trim() === '') {
    return [];
  }

  const items = [];

  // Split by comma (but be careful with commas inside parentheses)
  const parts = itemsString.split(',').map(s => s.trim());

  for (const part of parts) {
    if (!part) continue;

    // Check if item has quantity in parentheses like "Plates (7)" or "pans (2)"
    const quantityMatch = part.match(/^(.+?)\s*\((\d+)\)\s*$/);

    if (quantityMatch) {
      const itemName = quantityMatch[1].trim();
      const quantity = parseInt(quantityMatch[2], 10);
      items.push({ name: itemName, quantity });
    } else {
      // No quantity specified, assume 1
      items.push({ name: part.trim(), quantity: 1 });
    }
  }

  return items;
}

// Import CSV data
function importCSV() {
  return new Promise((resolve, reject) => {
    console.log('📥 Reading CSV file...');

    const checkouts = [];
    const stream = fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        checkouts.push(row);
      })
      .on('end', () => {
        console.log(`✅ Read ${checkouts.length} checkout records from CSV`);

        // Insert checkouts and items
        const insertCheckout = db.prepare(`
          INSERT INTO checkouts (date, owner_name, email, housing_assignment, graduation_year, total_items, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const insertItem = db.prepare(`
          INSERT INTO items (checkout_id, item_name, item_quantity)
          VALUES (?, ?, ?)
        `);

        // Use transaction for better performance
        const insertMany = db.transaction((checkoutsData) => {
          let totalItemsInserted = 0;

          for (const checkout of checkoutsData) {
            // Insert checkout
            const result = insertCheckout.run(
              checkout.Date,
              checkout["Owner's Name"],
              checkout.Email,
              checkout['Housing Assignment'],
              checkout['Graduation Year'],
              checkout['# of Items Checked Out'],
              checkout.Notes || ''
            );

            const checkoutId = result.lastInsertRowid;

            // Parse and insert individual items
            const items = parseItems(checkout.Items);
            for (const item of items) {
              insertItem.run(checkoutId, item.name, item.quantity);
              totalItemsInserted++;
            }
          }

          return totalItemsInserted;
        });

        const totalItems = insertMany(checkouts);
        console.log(`✅ Inserted ${checkouts.length} checkouts`);
        console.log(`✅ Inserted ${totalItems} individual items`);

        resolve({ checkouts: checkouts.length, items: totalItems });
      })
      .on('error', reject);
  });
}

// Get statistics
function getStats() {
  console.log('\n📊 Database Statistics:');

  const checkoutCount = db.prepare('SELECT COUNT(*) as count FROM checkouts').get();
  console.log(`   Total Checkouts: ${checkoutCount.count}`);

  const itemCount = db.prepare('SELECT COUNT(*) as count FROM items').get();
  console.log(`   Total Items: ${itemCount.count}`);

  const pendingItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE verification_status = 'pending'").get();
  console.log(`   Pending Verification: ${pendingItems.count}`);

  // Sample query: Top 10 most common items
  console.log('\n🔝 Top 10 Most Common Items:');
  const topItems = db.prepare(`
    SELECT item_name, SUM(item_quantity) as total_quantity, COUNT(*) as checkout_count
    FROM items
    GROUP BY LOWER(item_name)
    ORDER BY total_quantity DESC
    LIMIT 10
  `).all();

  topItems.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.item_name}: ${item.total_quantity} (in ${item.checkout_count} checkouts)`);
  });
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting CSV to SQLite import...\n');

    // Create tables
    createTables();

    // Import CSV data
    await importCSV();

    // Show statistics
    getStats();

    console.log('\n✨ Import completed successfully!');
    console.log(`📁 Database saved to: ${DB_PATH}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run the script
main();
