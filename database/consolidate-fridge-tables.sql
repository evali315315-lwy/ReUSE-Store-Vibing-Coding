-- Migration: Consolidate Fridge Tables
-- This script consolidates fridges, fridge_inventory, fridge_checkouts, fridge_maintenance
-- into a single fridge table and integrates student fridge checkouts into the main checkouts/items system

-- ============================================================================
-- STEP 1: Create new unified fridge table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fridges_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fridge_number TEXT UNIQUE NOT NULL,
  brand TEXT,
  model TEXT,
  size TEXT,
  color TEXT,
  has_freezer INTEGER DEFAULT 0,
  condition TEXT CHECK (condition IN ('Good', 'Fair', 'Needs Repair')) DEFAULT 'Good',
  status TEXT CHECK (status IN ('available', 'checked_out', 'maintenance', 'retired')) DEFAULT 'available',
  notes TEXT,
  date_acquired DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 2: Migrate data from fridges and fridge_inventory into fridges_new
-- ============================================================================

-- Insert from fridges table first
INSERT INTO fridges_new (
  fridge_number, brand, model, size, condition, status, notes, date_acquired, created_at, updated_at
)
SELECT
  fridge_number,
  brand,
  model,
  size,
  condition,
  status,
  notes,
  date_acquired,
  created_at,
  updated_at
FROM fridges;

-- Update with additional data from fridge_inventory where it exists
-- (color, has_freezer fields that only exist in fridge_inventory)
UPDATE fridges_new
SET
  color = (SELECT color FROM fridge_inventory WHERE CAST(fridge_inventory.fridge_number AS TEXT) = fridges_new.fridge_number),
  has_freezer = (SELECT has_freezer FROM fridge_inventory WHERE CAST(fridge_inventory.fridge_number AS TEXT) = fridges_new.fridge_number)
WHERE EXISTS (
  SELECT 1 FROM fridge_inventory
  WHERE CAST(fridge_inventory.fridge_number AS TEXT) = fridges_new.fridge_number
);

-- ============================================================================
-- STEP 3: Migrate fridge checkouts into main checkouts/items tables
-- ============================================================================

-- For each active fridge checkout, create a checkout entry and an item entry
INSERT INTO checkouts (
  year_range,
  date,
  owner_name,
  email,
  housing_assignment,
  graduation_year,
  total_items,
  notes,
  created_at
)
SELECT
  -- Determine year range from checkout_date
  CASE
    WHEN strftime('%m', fc.checkout_date) >= '08'
    THEN strftime('%Y', fc.checkout_date) || '-' || strftime('%Y', fc.checkout_date, '+1 year')
    ELSE strftime('%Y', fc.checkout_date, '-1 year') || '-' || strftime('%Y', fc.checkout_date)
  END as year_range,
  DATE(fc.checkout_date) as date,
  fc.student_name as owner_name,
  fc.student_email as email,
  fc.housing_assignment,
  NULL as graduation_year, -- fridge_checkouts doesn't have grad year
  1 as total_items, -- Each checkout has 1 fridge
  'Migrated from fridge_checkouts. Original checkout ID: ' || fc.id ||
  COALESCE('. Checkout notes: ' || fc.notes_checkout, '') ||
  COALESCE('. Return notes: ' || fc.notes_return, '') ||
  '. Expected return: ' || fc.expected_return_date ||
  COALESCE('. Phone: ' || fc.phone_number, '') ||
  COALESCE('. Student ID: ' || fc.student_id, '') as notes,
  fc.created_at
FROM fridge_checkouts fc
WHERE fc.id NOT IN (
  -- Don't migrate if already exists (prevents duplicates on re-run)
  SELECT CAST(SUBSTR(notes, INSTR(notes, 'Original checkout ID: ') + 22,
    INSTR(SUBSTR(notes, INSTR(notes, 'Original checkout ID: ') + 22), '.') - 1) AS INTEGER)
  FROM checkouts
  WHERE notes LIKE '%Migrated from fridge_checkouts%'
);

-- Create corresponding items for each fridge checkout
INSERT INTO items (
  checkout_id,
  year_range,
  item_name,
  item_quantity,
  verification_status,
  description,
  fridge_company_id,
  created_at
)
SELECT
  c.id as checkout_id,
  c.year_range,
  'Fridge #' || fn.fridge_number as item_name,
  1 as item_quantity,
  CASE
    WHEN fc.status = 'returned' THEN 'approved'
    WHEN fc.status = 'active' THEN 'pending'
    ELSE 'flagged'
  END as verification_status,
  COALESCE(fn.brand, 'Unknown') || ' ' ||
  COALESCE(fn.size, '') || ' fridge' ||
  CASE WHEN fn.has_freezer = 1 THEN ' with freezer' ELSE '' END ||
  '. Condition at checkout: ' || COALESCE(fc.condition_at_checkout, 'Not recorded') ||
  CASE
    WHEN fc.actual_return_date IS NOT NULL
    THEN '. Returned on ' || fc.actual_return_date || '. Condition at return: ' || COALESCE(fc.condition_at_return, 'Not recorded')
    ELSE '. Status: ' || fc.status
  END as description,
  NULL as fridge_company_id, -- Can be populated later if needed
  fc.created_at
FROM fridge_checkouts fc
JOIN checkouts c ON c.notes LIKE '%Original checkout ID: ' || fc.id || '.%'
JOIN fridges f ON f.id = fc.fridge_id
JOIN fridges_new fn ON fn.fridge_number = f.fridge_number
WHERE fc.id NOT IN (
  -- Don't migrate if already exists
  SELECT CAST(SUBSTR(i.description, INSTR(c.notes, 'Original checkout ID: ') + 22,
    INSTR(SUBSTR(c.notes, INSTR(c.notes, 'Original checkout ID: ') + 22), '.') - 1) AS INTEGER)
  FROM items i
  JOIN checkouts c ON i.checkout_id = c.id
  WHERE c.notes LIKE '%Migrated from fridge_checkouts%'
);

-- ============================================================================
-- STEP 4: Migrate maintenance records to notes in fridges_new
-- ============================================================================

-- Append maintenance history to fridge notes
UPDATE fridges_new
SET notes = COALESCE(notes || ' | ', '') ||
  'Maintenance History: ' ||
  (SELECT GROUP_CONCAT(
    maintenance_date || ': ' || maintenance_type || ' - ' || description ||
    COALESCE(' ($' || cost || ')', ''),
    ' | '
  )
  FROM fridge_maintenance fm
  JOIN fridges f ON fm.fridge_id = f.id
  WHERE f.fridge_number = fridges_new.fridge_number
  )
WHERE EXISTS (
  SELECT 1 FROM fridge_maintenance fm
  JOIN fridges f ON fm.fridge_id = f.id
  WHERE f.fridge_number = fridges_new.fridge_number
);

-- ============================================================================
-- STEP 5: Replace old fridges table with new consolidated one
-- ============================================================================

-- Drop old tables
DROP TABLE IF EXISTS fridges;
DROP TABLE IF EXISTS fridge_inventory;
DROP TABLE IF EXISTS fridge_checkouts;
DROP TABLE IF EXISTS fridge_maintenance;

-- Rename new table
ALTER TABLE fridges_new RENAME TO fridges;

-- Recreate indexes
CREATE INDEX idx_fridges_status ON fridges(status);
CREATE INDEX idx_fridges_fridge_number ON fridges(fridge_number);
CREATE INDEX idx_fridges_brand ON fridges(brand);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary query to verify migration
SELECT
  'Fridges' as table_name, COUNT(*) as count FROM fridges
UNION ALL
SELECT 'Checkouts with migrated fridge data', COUNT(*) FROM checkouts WHERE notes LIKE '%Migrated from fridge_checkouts%'
UNION ALL
SELECT 'Items (fridges)', COUNT(*) FROM items WHERE item_name LIKE 'Fridge #%';
