import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse CSV manually
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    // Simple CSV parsing (handles basic cases)
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let char of lines[i]) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length >= headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header.trim()] = values[index] || '';
      });
      records.push(record);
    }
  }

  return records;
}

// Initialize database
const dbPath = join(__dirname, '..', 'backend', 'src', 'db', 'reuse-store.db');
const db = new Database(dbPath);

console.log('Starting fridge CSV import...\n');

// Parse the CSV
const csvPath = join(__dirname, '..', 'Copy of Fridge Inventory _ (RE)use Store - 2025 - 2026 Check Out.csv');
const records = parseCSV(csvPath);

console.log(`Found ${records.length} records in CSV\n`);

// Clear existing fridge data
db.prepare('DELETE FROM fridge_checkouts').run();
db.prepare('DELETE FROM fridges').run();
console.log('Cleared existing fridge data\n');

let fridgesCreated = 0;
let checkoutsCreated = 0;

// Process each record
for (const record of records) {
  const fridgeNumber = record.Number;

  // Skip header row and invalid numbers
  if (!fridgeNumber || fridgeNumber === 'STILL IN STORE' || fridgeNumber === 'Number') {
    continue;
  }

  // Determine size category
  let size = 'Standard';
  const sizeRaw = record.Size || '';
  if (sizeRaw.toLowerCase().includes('cube')) {
    size = 'Compact';
  } else if (sizeRaw.toLowerCase().includes('large')) {
    size = 'Large';
  } else if (sizeRaw.toLowerCase().includes('mid')) {
    size = 'Medium';
  } else if (sizeRaw.toLowerCase().includes('freezer')) {
    size = 'Full Size with Freezer';
  }

  // Extract brand
  const brandType = record['Brand | Type'] || '';
  const brand = brandType.split('|')[0].trim() || 'Unknown';

  // Determine condition
  let condition = 'Good';
  const notes = record.Notes || '';
  if (notes.toLowerCase().includes('broken') || notes.toLowerCase().includes('intends to return')) {
    condition = 'Needs Repair';
  }

  // Determine status
  const checkoutDate = record['Check-out Date'];
  const ownerName = record["Owner's Name"];
  let status = 'available';

  if (checkoutDate && ownerName && ownerName !== 'MISSING PHOTO' && ownerName !== 'BROKEN') {
    status = 'checked_out';
  }

  // Create fridge record
  try {
    const insertFridge = db.prepare(`
      INSERT INTO fridges (fridge_number, brand, model, size, condition, status, date_acquired)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertFridge.run(
      fridgeNumber,
      brand || null,
      null, // model not in CSV
      size,
      condition,
      status,
      '2024-08-01' // Approximate acquisition date
    );

    fridgesCreated++;

    // Create checkout record if checked out
    if (status === 'checked_out' && checkoutDate && ownerName) {
      const email = record.Email || '';

      // Parse checkout date (format: M/D/YYYY)
      let checkoutDateSQL = null;
      if (checkoutDate) {
        const parts = checkoutDate.split('/');
        if (parts.length === 3) {
          const month = parts[0].padStart(2, '0');
          const day = parts[1].padStart(2, '0');
          const year = parts[2];
          checkoutDateSQL = `${year}-${month}-${day}`;
        }
      }

      // Expected return date is May 31, 2026
      const expectedReturnDate = '2026-05-31';

      // Get the fridge ID we just created
      const fridge = db.prepare('SELECT id FROM fridges WHERE fridge_number = ?').get(fridgeNumber);

      if (fridge) {
        const insertCheckout = db.prepare(`
          INSERT INTO fridge_checkouts (
            fridge_id, student_name, student_email, housing_assignment,
            checkout_date, expected_return_date, condition_at_checkout,
            notes_checkout, checked_out_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertCheckout.run(
          fridge.id,
          ownerName,
          email || null,
          'Unknown', // Housing not in CSV
          checkoutDateSQL || new Date().toISOString().split('T')[0],
          expectedReturnDate,
          condition,
          notes || null,
          'CSV Import'
        );

        checkoutsCreated++;
      }
    }
  } catch (error) {
    console.error(`Error processing fridge ${fridgeNumber}:`, error.message);
  }
}

console.log(`\n✓ Import complete!`);
console.log(`  - Fridges created: ${fridgesCreated}`);
console.log(`  - Checkouts created: ${checkoutsCreated}`);

db.close();
