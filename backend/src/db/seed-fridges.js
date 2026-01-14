import db from './database.js';

console.log('Seeding fridge inventory data...\n');

// Sample fridges
const sampleFridges = [
  { fridgeNumber: 'F001', brand: 'Frigidaire', model: 'FFPS4533UM', size: 'Mini', condition: 'Good' },
  { fridgeNumber: 'F002', brand: 'Danby', model: 'DCR044A2BDD', size: 'Compact', condition: 'Good' },
  { fridgeNumber: 'F003', brand: 'Whirlpool', model: 'WH43S1E', size: 'Mini', condition: 'Good' },
  { fridgeNumber: 'F004', brand: 'Magic Chef', model: 'MCBR445S2', size: 'Mini', condition: 'Fair' },
  { fridgeNumber: 'F005', brand: 'GE', model: 'GME04GLKLB', size: 'Compact', condition: 'Good' },
  { fridgeNumber: 'F006', brand: 'Black+Decker', model: 'BCRK25B', size: 'Compact', condition: 'Good' },
  { fridgeNumber: 'F007', brand: 'Frigidaire', model: 'EFR376', size: 'Mini', condition: 'Good' },
  { fridgeNumber: 'F008', brand: 'Danby', model: 'DAR044A6DDB', size: 'Mini', condition: 'Needs Repair', notes: 'Door seal needs replacement' },
  { fridgeNumber: 'F009', brand: 'Midea', model: 'WHD-113FSS1', size: 'Mini', condition: 'Good' },
  { fridgeNumber: 'F010', brand: 'Haier', model: 'HC32SW20RB', size: 'Compact', condition: 'Good' },
];

// Sample checkouts (2 active, 1 to be returned)
const sampleCheckouts = [
  {
    fridgeNumber: 'F001',
    studentName: 'Alice Williams',
    studentEmail: 'awilliams@haverford.edu',
    studentId: '12345',
    housingAssignment: 'Lloyd 305',
    phoneNumber: '(555) 123-4567',
    expectedReturnDate: '2026-05-31',
    conditionAtCheckout: 'Good',
    checkedOutBy: 'Staff Member',
    daysAgo: 30
  },
  {
    fridgeNumber: 'F003',
    studentName: 'Bob Martinez',
    studentEmail: 'bmartinez@haverford.edu',
    studentId: '67890',
    housingAssignment: 'Barclay 210',
    phoneNumber: '(555) 234-5678',
    expectedReturnDate: '2026-05-31',
    conditionAtCheckout: 'Good',
    checkedOutBy: 'Staff Member',
    daysAgo: 45
  },
  {
    fridgeNumber: 'F005',
    studentName: 'Carol Chen',
    studentEmail: 'cchen@haverford.edu',
    studentId: '11111',
    housingAssignment: 'Gummere 104',
    phoneNumber: '(555) 345-6789',
    expectedReturnDate: '2026-05-31',
    conditionAtCheckout: 'Fair',
    notesCheckout: 'Minor scratch on side',
    checkedOutBy: 'Staff Member',
    daysAgo: 60
  }
];

try {
  // Clear existing data
  console.log('Clearing existing fridge data...');
  db.prepare('DELETE FROM fridge_maintenance').run();
  db.prepare('DELETE FROM fridge_checkouts').run();
  db.prepare('DELETE FROM fridges').run();
  console.log('✅ Cleared existing fridge data\n');

  // Insert fridges
  const insertFridge = db.prepare(`
    INSERT INTO fridges (fridge_number, brand, model, size, condition, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  console.log('Adding fridges to inventory...');
  sampleFridges.forEach(fridge => {
    // Check if this fridge will be checked out
    const willBeCheckedOut = sampleCheckouts.some(c => c.fridgeNumber === fridge.fridgeNumber);
    const status = fridge.condition === 'Needs Repair' ? 'maintenance' : (willBeCheckedOut ? 'checked_out' : 'available');

    insertFridge.run(
      fridge.fridgeNumber,
      fridge.brand,
      fridge.model,
      fridge.size,
      fridge.condition,
      status,
      fridge.notes || null
    );
    console.log(`✅ Added ${fridge.fridgeNumber} - ${fridge.brand} ${fridge.model} (${status})`);
  });

  // Insert checkouts
  console.log('\nCreating checkout records...');
  const insertCheckout = db.prepare(`
    INSERT INTO fridge_checkouts (
      fridge_id, student_name, student_email, student_id,
      housing_assignment, phone_number, checkout_date, expected_return_date,
      condition_at_checkout, notes_checkout, checked_out_by, status
    ) VALUES (
      (SELECT id FROM fridges WHERE fridge_number = ?),
      ?, ?, ?, ?, ?, datetime('now', ?), ?, ?, ?, ?, 'active'
    )
  `);

  sampleCheckouts.forEach(checkout => {
    const timeOffset = `-${checkout.daysAgo} days`;
    insertCheckout.run(
      checkout.fridgeNumber,
      checkout.studentName,
      checkout.studentEmail,
      checkout.studentId,
      checkout.housingAssignment,
      checkout.phoneNumber || null,
      timeOffset,
      checkout.expectedReturnDate,
      checkout.conditionAtCheckout,
      checkout.notesCheckout || null,
      checkout.checkedOutBy
    );
    console.log(`✅ Checked out ${checkout.fridgeNumber} to ${checkout.studentName} (${checkout.daysAgo} days ago)`);
  });

  // Show statistics
  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM fridges').get().count,
    available: db.prepare('SELECT COUNT(*) as count FROM fridges WHERE status = ?').get('available').count,
    checkedOut: db.prepare('SELECT COUNT(*) as count FROM fridges WHERE status = ?').get('checked_out').count,
    maintenance: db.prepare('SELECT COUNT(*) as count FROM fridges WHERE status = ?').get('maintenance').count,
    activeCheckouts: db.prepare('SELECT COUNT(*) as count FROM fridge_checkouts WHERE status = ?').get('active').count
  };

  console.log(`\n📊 Statistics:`);
  console.log(`   Total fridges: ${stats.total}`);
  console.log(`   Available: ${stats.available}`);
  console.log(`   Checked out: ${stats.checkedOut}`);
  console.log(`   In maintenance: ${stats.maintenance}`);
  console.log(`   Active checkouts: ${stats.activeCheckouts}`);
  console.log(`\n✅ Fridge inventory seeded successfully!`);
  console.log(`\n🌐 Visit http://localhost:5173/fridges to manage the fridge inventory`);
  console.log(`   (Switch to "Administrator" mode in the header dropdown)\n`);

} catch (error) {
  console.error('❌ Error seeding data:', error);
  process.exit(1);
}

db.close();
process.exit(0);
