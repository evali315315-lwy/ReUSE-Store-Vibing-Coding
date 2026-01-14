-- Fridge Inventory System
-- Tracks fridges that must be returned by end of year

-- Fridge inventory table: stores all fridges in the ReUSE store
CREATE TABLE IF NOT EXISTS fridges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fridge_number TEXT UNIQUE NOT NULL, -- e.g., "F001", "F002"
  brand TEXT,
  model TEXT,
  size TEXT, -- e.g., "Mini", "Compact", "Standard"
  condition TEXT CHECK (condition IN ('Good', 'Fair', 'Needs Repair')) DEFAULT 'Good',
  status TEXT CHECK (status IN ('available', 'checked_out', 'maintenance', 'retired')) DEFAULT 'available',
  notes TEXT,
  date_acquired DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fridges_status ON fridges(status);
CREATE INDEX IF NOT EXISTS idx_fridges_fridge_number ON fridges(fridge_number);

-- Fridge checkout records: tracks who has which fridge
CREATE TABLE IF NOT EXISTS fridge_checkouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fridge_id INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_id TEXT, -- Student ID number
  housing_assignment TEXT NOT NULL,
  phone_number TEXT,
  checkout_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expected_return_date DATE NOT NULL, -- End of academic year
  actual_return_date DATETIME,
  condition_at_checkout TEXT CHECK (condition_at_checkout IN ('Good', 'Fair', 'Needs Repair')),
  condition_at_return TEXT CHECK (condition_at_return IN ('Good', 'Fair', 'Needs Repair', 'Damaged', 'Lost')),
  notes_checkout TEXT,
  notes_return TEXT,
  checked_out_by TEXT, -- Staff member who processed checkout
  checked_in_by TEXT, -- Staff member who processed return
  status TEXT CHECK (status IN ('active', 'returned', 'overdue', 'lost')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fridge_id) REFERENCES fridges(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fridge_checkouts_fridge_id ON fridge_checkouts(fridge_id);
CREATE INDEX IF NOT EXISTS idx_fridge_checkouts_student_email ON fridge_checkouts(student_email);
CREATE INDEX IF NOT EXISTS idx_fridge_checkouts_status ON fridge_checkouts(status);
CREATE INDEX IF NOT EXISTS idx_fridge_checkouts_checkout_date ON fridge_checkouts(checkout_date DESC);
CREATE INDEX IF NOT EXISTS idx_fridge_checkouts_expected_return_date ON fridge_checkouts(expected_return_date);

-- Fridge maintenance log: tracks repairs and maintenance
CREATE TABLE IF NOT EXISTS fridge_maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fridge_id INTEGER NOT NULL,
  maintenance_type TEXT NOT NULL, -- e.g., "Repair", "Cleaning", "Inspection"
  description TEXT NOT NULL,
  cost DECIMAL(10, 2),
  performed_by TEXT,
  maintenance_date DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fridge_id) REFERENCES fridges(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fridge_maintenance_fridge_id ON fridge_maintenance(fridge_id);
CREATE INDEX IF NOT EXISTS idx_fridge_maintenance_date ON fridge_maintenance(maintenance_date DESC);
