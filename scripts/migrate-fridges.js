import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../database/reuse-store.db');
const db = new sqlite3.default.Database(dbPath);

function extractCompany(itemName) {
  // Extract company from "Fridge (Company)" format
  const match = itemName.match(/\(([^)]+)\)/);
  if (match) {
    return match[1].replace('?', '').trim();
  }
  return 'Unknown';
}

async function migrateFridges() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Get all fridge items
      db.all(
        `SELECT id, item_name FROM items
         WHERE LOWER(item_name) LIKE '%fridge%' OR LOWER(item_name) LIKE '%refrigerator%'`,
        [],
        (err, items) => {
          if (err) {
            console.error('Error fetching fridge items:', err);
            reject(err);
            return;
          }

          console.log(`Found ${items.length} fridge items to migrate`);

          // Process each fridge item
          let processed = 0;

          items.forEach((item) => {
            const company = extractCompany(item.item_name);

            // Insert fridge record
            db.run(
              `INSERT INTO fridges (company) VALUES (?)`,
              [company],
              function(insertErr) {
                if (insertErr) {
                  console.error(`Error inserting fridge for item ${item.id}:`, insertErr);
                  return;
                }

                const fridgeId = this.lastID;

                // Update item to reference the fridge
                db.run(
                  `UPDATE items SET fridge_id = ? WHERE id = ?`,
                  [fridgeId, item.id],
                  (updateErr) => {
                    if (updateErr) {
                      console.error(`Error updating item ${item.id}:`, updateErr);
                    } else {
                      console.log(`✓ Migrated: ${item.item_name} → Fridge ID ${fridgeId} (Company: ${company})`);
                    }

                    processed++;
                    if (processed === items.length) {
                      console.log('\n✅ Migration complete!');
                      resolve();
                    }
                  }
                );
              }
            );
          });

          if (items.length === 0) {
            resolve();
          }
        }
      );
    });
  });
}

// Run migration
migrateFridges()
  .then(() => {
    db.close();
    console.log('Database connection closed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    db.close();
    process.exit(1);
  });
