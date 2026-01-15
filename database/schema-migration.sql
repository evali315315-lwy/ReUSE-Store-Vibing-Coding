-- Migration Script: Add Check-In/Check-Out System Tables
-- This script adds tables needed for the inventory check-in/check-out system
-- Safe to run multiple times (uses CREATE IF NOT EXISTS)

-- Students/Borrowers table
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  housing_assignment TEXT,
  graduation_year TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inventory items master table
CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fridge inventory table
CREATE TABLE IF NOT EXISTS fridge_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fridge_number INTEGER UNIQUE NOT NULL,
  has_freezer BOOLEAN NOT NULL,
  size TEXT,
  color TEXT,
  brand TEXT,
  condition TEXT,
  notes TEXT,
  status TEXT DEFAULT 'available',
  current_checkout_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fridge attribute tables (for dynamic dropdowns)
CREATE TABLE IF NOT EXISTS fridge_sizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fridge_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fridge_brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fridge_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Check-out records
CREATE TABLE IF NOT EXISTS checkouts_out (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  checkout_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expected_return_date DATETIME,
  actual_return_date DATETIME,
  status TEXT DEFAULT 'active',
  checked_out_by TEXT,
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Check-out items
CREATE TABLE IF NOT EXISTS checkout_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checkout_id INTEGER NOT NULL,
  item_id INTEGER,
  fridge_id INTEGER,
  quantity INTEGER DEFAULT 1,
  FOREIGN KEY (checkout_id) REFERENCES checkouts_out(id),
  FOREIGN KEY (item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (fridge_id) REFERENCES fridge_inventory(id)
);

-- Check-in records
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checkin_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  checked_in_by TEXT,
  notes TEXT
);

-- Check-in items
CREATE TABLE IF NOT EXISTS checkin_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checkin_id INTEGER NOT NULL,
  item_id INTEGER,
  fridge_id INTEGER,
  quantity INTEGER DEFAULT 1,
  checkout_item_id INTEGER,
  FOREIGN KEY (checkin_id) REFERENCES checkins(id),
  FOREIGN KEY (item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (fridge_id) REFERENCES fridge_inventory(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_fridge_inventory_number ON fridge_inventory(fridge_number);
CREATE INDEX IF NOT EXISTS idx_fridge_inventory_status ON fridge_inventory(status);
CREATE INDEX IF NOT EXISTS idx_checkouts_out_status ON checkouts_out(status);
CREATE INDEX IF NOT EXISTS idx_checkouts_out_student ON checkouts_out(student_id);

-- Seed initial fridge attribute data
-- Sizes
INSERT OR IGNORE INTO fridge_sizes (name, created_by) VALUES ('Compact', 'system');
INSERT OR IGNORE INTO fridge_sizes (name, created_by) VALUES ('Small', 'system');
INSERT OR IGNORE INTO fridge_sizes (name, created_by) VALUES ('Medium', 'system');
INSERT OR IGNORE INTO fridge_sizes (name, created_by) VALUES ('Large', 'system');
INSERT OR IGNORE INTO fridge_sizes (name, created_by) VALUES ('Extra Large', 'system');

-- Colors
INSERT OR IGNORE INTO fridge_colors (name, created_by) VALUES ('White', 'system');
INSERT OR IGNORE INTO fridge_colors (name, created_by) VALUES ('Black', 'system');
INSERT OR IGNORE INTO fridge_colors (name, created_by) VALUES ('Stainless Steel', 'system');
INSERT OR IGNORE INTO fridge_colors (name, created_by) VALUES ('Silver', 'system');
INSERT OR IGNORE INTO fridge_colors (name, created_by) VALUES ('Gray', 'system');
INSERT OR IGNORE INTO fridge_colors (name, created_by) VALUES ('Beige', 'system');

-- Brands
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Frigidaire', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('GE', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Whirlpool', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Samsung', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('LG', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Kenmore', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Danby', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Magic Chef', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Haier', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Midea', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Insignia', 'system');
INSERT OR IGNORE INTO fridge_brands (name, created_by) VALUES ('Other', 'system');

-- Conditions
INSERT OR IGNORE INTO fridge_conditions (name, created_by) VALUES ('Excellent', 'system');
INSERT OR IGNORE INTO fridge_conditions (name, created_by) VALUES ('Good', 'system');
INSERT OR IGNORE INTO fridge_conditions (name, created_by) VALUES ('Fair', 'system');
INSERT OR IGNORE INTO fridge_conditions (name, created_by) VALUES ('Needs Repair', 'system');

-- Migration complete
