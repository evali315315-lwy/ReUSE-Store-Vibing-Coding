-- Create inventory table to track current stock levels
-- Items are added to inventory when they are checked in (returned)

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT UNIQUE NOT NULL,
  quantity INTEGER DEFAULT 0,
  description TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on item_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON inventory(item_name);

-- Create a trigger to update last_updated timestamp
CREATE TRIGGER IF NOT EXISTS update_inventory_timestamp
AFTER UPDATE ON inventory
BEGIN
  UPDATE inventory SET last_updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
