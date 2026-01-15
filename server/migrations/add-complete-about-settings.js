import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runMigration() {
  const dbPath = path.join(__dirname, '../../database/reuse-store.db');
  const db = new Database(dbPath);

  console.log('Running migration: add-complete-about-settings');

  try {
    // Add all remaining text content as settings
    const newSettings = [
      // Static text
      {
        key: 'black_squirrel_text',
        value: JSON.stringify('Home of the Black Squirrel Initiative'),
        category: 'hero',
        description: 'Black Squirrel Initiative tagline'
      },
      {
        key: 'how_it_works_heading',
        value: JSON.stringify('How It Works'),
        category: 'sections',
        description: 'How It Works section heading'
      },
      {
        key: 'accepted_items_heading',
        value: JSON.stringify('Accepted & Non-Accepted Items'),
        category: 'sections',
        description: 'Accepted items section heading'
      },
      {
        key: 'we_accept_title',
        value: JSON.stringify('We Accept'),
        category: 'lists',
        description: 'We Accept list title'
      },
      {
        key: 'we_dont_accept_title',
        value: JSON.stringify("We Don't Accept"),
        category: 'lists',
        description: "We Don't Accept list title"
      },
      {
        key: 'visit_us_heading',
        value: JSON.stringify('Visit Us'),
        category: 'sections',
        description: 'Visit Us section heading'
      },
      {
        key: 'location_heading',
        value: JSON.stringify('Location'),
        category: 'sections',
        description: 'Location subsection heading'
      },
      {
        key: 'hours_heading',
        value: JSON.stringify('Hours'),
        category: 'sections',
        description: 'Hours subsection heading'
      },
      {
        key: 'hours_note',
        value: JSON.stringify('*Hours may vary during breaks and exam periods'),
        category: 'sections',
        description: 'Hours disclaimer note'
      },
      {
        key: 'get_in_touch_heading',
        value: JSON.stringify('Get in Touch'),
        category: 'sections',
        description: 'Contact section heading'
      },
      {
        key: 'get_in_touch_description',
        value: JSON.stringify('Have questions about donations, need to arrange a large item drop-off, or want to volunteer?'),
        category: 'contact',
        description: 'Contact section description'
      },
      {
        key: 'environmental_impact_heading',
        value: JSON.stringify('Our Environmental Impact'),
        category: 'sections',
        description: 'Environmental impact section heading'
      },
      {
        key: 'environmental_impact_text',
        value: JSON.stringify('Every item reused is an item that doesn\'t end up in a landfill. Check out our Statistics page to see the incredible impact our community has made through the ReUSE Store.'),
        category: 'sections',
        description: 'Environmental impact description'
      },

      // Donating items list
      {
        key: 'donating_items',
        value: JSON.stringify([
          'Bring clean, gently used items to the ReUSE Store during open hours',
          'Accepted items include: hangers, fans, kitchen goods, lamps, minifridges and small appliances, new toiletries, office goods, and much more!',
          'Our student workers will log your donation and ensure it finds a new home'
        ]),
        category: 'lists',
        description: 'Donating items bullet points'
      },

      // Shopping items list
      {
        key: 'shopping_items',
        value: JSON.stringify([
          'All items are completely free for Haverford students, faculty, and staff',
          'Visit during our open hours and browse available items',
          'Take what you need - no purchase or checkout required',
          'Please only take items you will actually use to ensure availability for others'
        ]),
        category: 'lists',
        description: 'Shopping/Taking items bullet points'
      },

      // Accepted items list
      {
        key: 'accepted_items',
        value: JSON.stringify([
          'Hangers',
          'Fans',
          'Kitchen Goods',
          'Lamps',
          'Minifridges and Small Appliances',
          'New Toiletries',
          'Office Goods',
          'So much more!!'
        ]),
        category: 'lists',
        description: 'List of accepted items'
      },

      // Not accepted items list
      {
        key: 'not_accepted_items',
        value: JSON.stringify([
          'Broken items',
          'Clothing and soft goods (towels, bedding, etc.)',
          'Dirty items',
          'Opened/Used toiletries',
          'Large furniture',
          'Mattress pads',
          'Nonperishable food',
          'Rugs',
          'Trash'
        ]),
        category: 'lists',
        description: 'List of non-accepted items'
      },

      // Environmental impact labels
      {
        key: 'impact_labels',
        value: JSON.stringify([
          'Reduce Waste',
          'Lower Carbon Footprint',
          'Support Community'
        ]),
        category: 'sections',
        description: 'Environmental impact section labels'
      }
    ];

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO settings (key, value, category, description, updated_by)
      VALUES (@key, @value, @category, @description, 'system')
    `);

    for (const setting of newSettings) {
      const result = insertStmt.run(setting);
      if (result.changes > 0) {
        console.log(`Added setting: ${setting.key}`);
      } else {
        console.log(`Setting already exists: ${setting.key}`);
      }
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
