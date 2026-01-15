-- Create table for item variants/descriptions
-- This allows tracking different types of the same item (e.g., "Standing Fan", "Desk Fan")
CREATE TABLE IF NOT EXISTS item_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_id INTEGER NOT NULL,
  variant_description TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
  UNIQUE(inventory_id, variant_description)
);

CREATE INDEX IF NOT EXISTS idx_item_variants_inventory_id ON item_variants(inventory_id);

CREATE TRIGGER IF NOT EXISTS update_item_variants_timestamp
AFTER UPDATE ON item_variants
BEGIN
  UPDATE item_variants SET last_updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
