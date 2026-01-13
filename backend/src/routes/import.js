import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { donorService } from '../services/donorService.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Validation schema for donor import
const donorImportSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  housing: z.string().max(100).optional().nullable(),
  gradYear: z.string().regex(/^\d{4}$/).optional().nullable()
});

/**
 * POST /api/import/donors
 * Import donors from CSV file
 *
 * Expected CSV formats:
 * 1. Stickered Items: Year of Entry, Check-out Date, Owner's Name, Email, Category, ...
 * 2. Waitlist: Date, Requestor, Email, Housing Assignment, Graduation Year, ...
 * 3. Simple: Name, Email, Housing, GradYear
 */
router.post('/donors', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse CSV
    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Detect CSV format and extract donor data
    const donors = extractDonorsFromCSV(records);

    // Validate and import donors
    const results = {
      total: donors.length,
      imported: 0,
      skipped: 0,
      errors: []
    };

    const importedDonors = [];

    for (let i = 0; i < donors.length; i++) {
      const donor = donors[i];
      const rowNum = i + 2; // +2 for header and 1-based indexing

      try {
        // Validate donor data
        const validationResult = donorImportSchema.safeParse(donor);

        if (!validationResult.success) {
          results.errors.push({
            row: rowNum,
            email: donor.email,
            error: 'Validation failed',
            details: validationResult.error.errors
          });
          results.skipped++;
          continue;
        }

        const validDonor = validationResult.data;

        // Check if donor already exists
        const existing = donorService.getDonorByEmail(validDonor.email);

        if (existing) {
          results.skipped++;
          continue;
        }

        // Create new donor
        const created = donorService.createDonor(validDonor);
        importedDonors.push(created);
        results.imported++;

      } catch (error) {
        results.errors.push({
          row: rowNum,
          email: donor.email,
          error: error.message
        });
        results.skipped++;
      }
    }

    res.json({
      ...results,
      donors: importedDonors
    });

  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/import/donors/preview
 * Preview donors from CSV without importing
 */
router.post('/donors/preview', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse CSV
    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Detect CSV format and extract donor data
    const donors = extractDonorsFromCSV(records);

    // Validate donors and check for duplicates
    const preview = donors.map((donor, index) => {
      const validationResult = donorImportSchema.safeParse(donor);
      const existing = donorService.getDonorByEmail(donor.email);

      return {
        row: index + 2,
        ...donor,
        valid: validationResult.success,
        exists: !!existing,
        errors: validationResult.success ? null : validationResult.error.errors
      };
    });

    res.json({
      total: preview.length,
      valid: preview.filter(d => d.valid && !d.exists).length,
      duplicates: preview.filter(d => d.exists).length,
      invalid: preview.filter(d => !d.valid).length,
      donors: preview
    });

  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * Extract donors from various CSV formats
 * @param {Array} records - Parsed CSV records
 * @returns {Array} Array of donor objects
 */
function extractDonorsFromCSV(records) {
  if (records.length === 0) return [];

  const firstRecord = records[0];
  const columns = Object.keys(firstRecord);

  // Detect CSV format
  let format = 'unknown';

  if (columns.includes("Owner's Name")) {
    format = 'stickered';
  } else if (columns.includes('Requestor') && columns.includes('Housing Assignment')) {
    format = 'waitlist';
  } else if (columns.includes('Name') && columns.includes('Email')) {
    format = 'simple';
  }

  // Extract donors based on format
  const donorMap = new Map(); // Use map to deduplicate by email

  records.forEach(record => {
    let donor = null;

    switch (format) {
      case 'stickered':
        donor = {
          name: (record["Owner's Name"] || '').trim(),
          email: (record['Email'] || '').trim().toLowerCase(),
          housing: null,
          gradYear: null
        };
        break;

      case 'waitlist':
        donor = {
          name: (record['Requestor'] || '').trim(),
          email: (record['Email'] || '').trim().toLowerCase(),
          housing: (record['Housing Assignment'] || '').trim() || null,
          gradYear: (record['Graduation Year'] || '').trim() || null
        };
        break;

      case 'simple':
        donor = {
          name: (record['Name'] || '').trim(),
          email: (record['Email'] || '').trim().toLowerCase(),
          housing: (record['Housing'] || '').trim() || null,
          gradYear: (record['GradYear'] || record['Graduation Year'] || '').trim() || null
        };
        break;

      default:
        // Try to auto-detect columns
        const nameCol = columns.find(c => c.toLowerCase().includes('name'));
        const emailCol = columns.find(c => c.toLowerCase().includes('email'));
        const housingCol = columns.find(c => c.toLowerCase().includes('housing'));
        const gradYearCol = columns.find(c =>
          c.toLowerCase().includes('grad') || c.toLowerCase().includes('year')
        );

        if (nameCol && emailCol) {
          donor = {
            name: (record[nameCol] || '').trim(),
            email: (record[emailCol] || '').trim().toLowerCase(),
            housing: housingCol ? (record[housingCol] || '').trim() || null : null,
            gradYear: gradYearCol ? (record[gradYearCol] || '').trim() || null : null
          };
        }
    }

    // Add to map if valid (has name and email)
    if (donor && donor.name && donor.email) {
      donorMap.set(donor.email, donor);
    }
  });

  return Array.from(donorMap.values());
}

export default router;
