-- Add verification columns to existing tables
-- This extends the schema for photo verification functionality

-- Add verification_status to products table
ALTER TABLE products ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'flagged'));
ALTER TABLE products ADD COLUMN verified_at DATETIME;
ALTER TABLE products ADD COLUMN verified_by TEXT;

-- Create checkouts table to group donation submissions
CREATE TABLE IF NOT EXISTS checkouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  housing_assignment TEXT,
  graduation_year TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'flagged')),
  verified_at DATETIME,
  verified_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checkouts_date ON checkouts(date DESC);
CREATE INDEX IF NOT EXISTS idx_checkouts_email ON checkouts(email);
CREATE INDEX IF NOT EXISTS idx_checkouts_verification_status ON checkouts(verification_status);

-- Create checkout_items table to link items to checkout sessions
CREATE TABLE IF NOT EXISTS checkout_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checkout_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  item_quantity INTEGER DEFAULT 1,
  description TEXT,
  image_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'flagged')),
  verified_at DATETIME,
  verified_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (checkout_id) REFERENCES checkouts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_checkout_items_checkout_id ON checkout_items(checkout_id);
CREATE INDEX IF NOT EXISTS idx_checkout_items_verification_status ON checkout_items(verification_status);
