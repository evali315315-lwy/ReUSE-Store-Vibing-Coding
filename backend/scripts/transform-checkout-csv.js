#!/usr/bin/env node

/**
 * CSV Transformation Script
 * Converts checkout inventory CSV to donor-only CSV for backend import
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const INPUT_CSV = process.argv[2] || '2022 - 2023 (RE)use Store Inventory - Detailed Check-out-2.csv';
const OUTPUT_CSV = 'donors-import.csv';

console.log('🔄 ReUSE Store CSV Transformation Tool\n');

// Read and parse input CSV
console.log(`📖 Reading: ${INPUT_CSV}`);

let inputPath = INPUT_CSV;
if (!path.isAbsolute(INPUT_CSV)) {
  // Try relative to project root
  inputPath = path.join(__dirname, '../../', INPUT_CSV);
}

if (!fs.existsSync(inputPath)) {
  console.error(`❌ Error: File not found at ${inputPath}`);
  console.error('Usage: node transform-checkout-csv.js [path-to-csv]');
  process.exit(1);
}

const csvContent = fs.readFileSync(inputPath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

console.log(`   Found ${records.length} rows\n`);

// Transform and deduplicate donors
const donorMap = new Map();
let skippedInvalidEmail = 0;
let skippedDuplicate = 0;
let skippedMissingData = 0;

console.log('🔄 Processing donors...');

records.forEach((row, index) => {
  const name = row["Owner's Name"] || row["Owner's Name"]?.trim();
  const email = row["Email"]?.trim().toLowerCase();
  const housing = row["Housing Assignment"]?.trim();
  const gradYear = row["Graduation Year"]?.trim();

  // Skip empty rows
  if (!name && !email) {
    return;
  }

  // Validate email
  if (!email || !email.includes('@')) {
    skippedInvalidEmail++;
    console.log(`   ⚠️  Row ${index + 2}: Skipping invalid email: "${email || 'empty'}"`);
    return;
  }

  // Skip if missing name
  if (!name) {
    skippedMissingData++;
    console.log(`   ⚠️  Row ${index + 2}: Skipping missing name for email: ${email}`);
    return;
  }

  // Check for duplicate
  if (donorMap.has(email)) {
    skippedDuplicate++;
    return;
  }

  // Clean graduation year (keep only 4-digit years or empty)
  let cleanGradYear = '';
  if (gradYear) {
    const yearMatch = gradYear.match(/\d{4}/);
    if (yearMatch) {
      cleanGradYear = yearMatch[0];
    }
  }

  // Add to donor map
  donorMap.set(email, {
    Name: name,
    Email: email,
    Housing: housing || '',
    GradYear: cleanGradYear
  });
});

console.log(`\n📊 Processing Summary:`);
console.log(`   ✅ Unique donors: ${donorMap.size}`);
console.log(`   ⏭️  Duplicates skipped: ${skippedDuplicate}`);
console.log(`   ❌ Invalid emails skipped: ${skippedInvalidEmail}`);
console.log(`   ❌ Missing data skipped: ${skippedMissingData}`);

// Convert to array and sort by name
const donors = Array.from(donorMap.values()).sort((a, b) =>
  a.Name.localeCompare(b.Name)
);

// Generate output CSV
const outputPath = path.join(__dirname, '../../', OUTPUT_CSV);
const csvOutput = stringify(donors, {
  header: true,
  columns: ['Name', 'Email', 'Housing', 'GradYear']
});

fs.writeFileSync(outputPath, csvOutput);

console.log(`\n✅ Success! Output written to: ${OUTPUT_CSV}`);
console.log(`   ${donors.length} donors ready for import\n`);

// Show sample of output
console.log('📝 Sample output (first 5 donors):');
donors.slice(0, 5).forEach(donor => {
  console.log(`   ${donor.Name} <${donor.Email}> - ${donor.Housing || 'N/A'} '${donor.GradYear || 'N/A'}`);
});

if (donors.length > 5) {
  console.log(`   ... and ${donors.length - 5} more`);
}

console.log(`\n🚀 Next step: Import with:`);
console.log(`   cd backend && npm run seed -- --csv=../${OUTPUT_CSV}\n`);
