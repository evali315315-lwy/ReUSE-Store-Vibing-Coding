import db from './database.js';

console.log('Seeding verification data...\n');

// Sample checkouts with items
const sampleCheckouts = [
  {
    owner_name: 'John Smith',
    email: 'jsmith@haverford.edu',
    housing_assignment: 'Lloyd 201',
    graduation_year: '2025',
    items: [
      {
        item_name: 'Mini Fridge',
        item_quantity: 1,
        description: 'White mini fridge, works perfectly',
        image_url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400'
      },
      {
        item_name: 'Desk Lamp',
        item_quantity: 2,
        description: 'Two reading lamps with adjustable necks',
        image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400'
      }
    ]
  },
  {
    owner_name: 'Sarah Johnson',
    email: 'sjohnson@haverford.edu',
    housing_assignment: 'Gummere 104',
    graduation_year: '2024',
    items: [
      {
        item_name: 'Hangers',
        item_quantity: 25,
        description: 'Plastic hangers in good condition',
        image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400'
      },
      {
        item_name: 'Kitchen Utensils',
        item_quantity: 1,
        description: 'Set of spatulas, spoons, and whisks',
        image_url: 'https://images.unsplash.com/photo-1556910110-a5a63dfd393c?w=400'
      },
      {
        item_name: 'Desk Fan',
        item_quantity: 1,
        description: 'Small oscillating fan',
        image_url: 'https://images.unsplash.com/photo-1558347263-4c8e8e2fe1d2?w=400'
      }
    ]
  },
  {
    owner_name: 'Michael Chen',
    email: 'mchen@haverford.edu',
    housing_assignment: 'Barclay 305',
    graduation_year: '2026',
    items: [
      {
        item_name: 'Office Supplies',
        item_quantity: 1,
        description: 'Notebooks, pens, folders, and organizers',
        image_url: 'https://images.unsplash.com/photo-1587828379799-58c0e040ae4f?w=400'
      }
    ]
  },
  {
    owner_name: 'Emily Davis',
    email: 'edavis@haverford.edu',
    housing_assignment: 'Comfort 212',
    graduation_year: '2025',
    items: [
      {
        item_name: 'Floor Lamp',
        item_quantity: 1,
        description: 'Tall standing lamp with three brightness settings',
        image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400'
      },
      {
        item_name: 'Storage Bins',
        item_quantity: 3,
        description: 'Plastic storage containers with lids',
        image_url: 'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=400'
      }
    ]
  },
  {
    owner_name: 'David Park',
    email: 'dpark@haverford.edu',
    housing_assignment: 'HPA 401',
    graduation_year: '2024',
    items: [
      {
        item_name: 'Microwave',
        item_quantity: 1,
        description: '700W microwave, barely used',
        image_url: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400'
      }
    ]
  }
];

try {
  // Clear existing test data
  db.prepare('DELETE FROM checkout_items').run();
  db.prepare('DELETE FROM checkouts').run();

  console.log('✅ Cleared existing checkout data\n');

  // Insert checkouts and items
  const insertCheckout = db.prepare(`
    INSERT INTO checkouts (date, owner_name, email, housing_assignment, graduation_year, verification_status)
    VALUES (datetime('now', ?), ?, ?, ?, ?, 'pending')
  `);

  const insertItem = db.prepare(`
    INSERT INTO checkout_items (checkout_id, item_name, item_quantity, description, image_url, verification_status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);

  sampleCheckouts.forEach((checkout, index) => {
    // Insert checkout (stagger dates by hours)
    const timeOffset = `-${index * 3} hours`;
    const result = insertCheckout.run(
      timeOffset,
      checkout.owner_name,
      checkout.email,
      checkout.housing_assignment,
      checkout.graduation_year
    );

    const checkoutId = result.lastInsertRowid;

    console.log(`✅ Created checkout ${checkoutId} for ${checkout.owner_name}`);

    // Insert items for this checkout
    checkout.items.forEach(item => {
      insertItem.run(
        checkoutId,
        item.item_name,
        item.item_quantity,
        item.description,
        item.image_url
      );
      console.log(`   - Added ${item.item_quantity}x ${item.item_name}`);
    });

    console.log('');
  });

  // Show statistics
  const stats = {
    pending: db.prepare('SELECT COUNT(*) as count FROM checkouts WHERE verification_status = ?').get('pending').count,
    totalItems: db.prepare('SELECT COUNT(*) as count FROM checkout_items').get().count
  };

  console.log(`\n📊 Statistics:`);
  console.log(`   Pending checkouts: ${stats.pending}`);
  console.log(`   Total items: ${stats.totalItems}`);
  console.log(`\n✅ Verification data seeded successfully!`);
  console.log(`\n🌐 Visit http://localhost:5173/verification to see the data\n`);

} catch (error) {
  console.error('❌ Error seeding data:', error);
  process.exit(1);
}

db.close();
process.exit(0);
