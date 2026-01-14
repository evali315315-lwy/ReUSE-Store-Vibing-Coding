import { readFileSync } from 'fs';
import db from './database.js';

/**
 * Import donors from CSV file
 * Expected CSV format:
 *   Name,Email
 *   Name,Email,Housing,GradYear (extended format)
 *
 * Usage: node src/db/seed.js --csv=/path/to/donors.csv
 */

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  const donors = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());

    if (values.length < 2) continue; // Skip invalid lines

    const donor = {
      name: values[0],
      email: values[1],
      housing: values[2] || null,
      gradYear: values[3] || null
    };

    // Validate email and name
    if (donor.name && donor.email && donor.email.includes('@')) {
      donors.push(donor);
    }
  }

  return donors;
}

function importDonors(csvPath) {
  console.log(`\n📂 Reading CSV file: ${csvPath}`);

  try {
    const content = readFileSync(csvPath, 'utf-8');
    const donors = parseCSV(content);

    console.log(`\n📊 Found ${donors.length} donors to import`);

    const insertStmt = db.prepare(`
      INSERT INTO donors (name, email, housing, grad_year)
      VALUES (?, ?, ?, ?)
    `);

    let imported = 0;
    let skipped = 0;

    for (const donor of donors) {
      try {
        insertStmt.run(
          donor.name,
          donor.email.toLowerCase(),
          donor.housing,
          donor.gradYear
        );
        imported++;
      } catch (error) {
        // Skip duplicates (UNIQUE constraint on email)
        if (error.message.includes('UNIQUE')) {
          skipped++;
        } else {
          console.error(`❌ Error importing ${donor.email}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Imported ${imported} donors`);
    console.log(`⏭️  Skipped ${skipped} duplicates`);
    console.log(`📈 Total processed: ${imported + skipped} records\n`);

    // Show sample of imported data
    const samples = db.prepare('SELECT * FROM donors LIMIT 5').all();
    console.log('📋 Sample of imported donors:');
    console.table(samples);

  } catch (error) {
    console.error('❌ Error reading CSV file:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const csvArg = args.find(arg => arg.startsWith('--csv='));

if (!csvArg) {
  console.error('❌ Usage: node src/db/seed.js --csv=/path/to/donors.csv');
  process.exit(1);
}

const csvPath = csvArg.split('=')[1];
importDonors(csvPath);
