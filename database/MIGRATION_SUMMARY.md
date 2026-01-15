# Fridge Tables Consolidation Migration

**Date:** 2026-01-15
**Status:** ✅ COMPLETED

## What Was Done

### 1. Consolidated Fridge Tables
Merged 4 separate fridge-related tables into 1 unified `fridges` table:
- ❌ `fridges` (old)
- ❌ `fridge_inventory`
- ❌ `fridge_checkouts`
- ❌ `fridge_maintenance`
- ✅ `fridges` (new, consolidated)

### 2. New Fridges Table Schema
```sql
CREATE TABLE fridges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fridge_number TEXT UNIQUE NOT NULL,
  brand TEXT,
  model TEXT,
  size TEXT,
  color TEXT,                    -- from fridge_inventory
  has_freezer INTEGER DEFAULT 0, -- from fridge_inventory
  condition TEXT CHECK (condition IN ('Good', 'Fair', 'Needs Repair')) DEFAULT 'Good',
  status TEXT CHECK (status IN ('available', 'checked_out', 'maintenance', 'retired')) DEFAULT 'available',
  notes TEXT,                    -- includes maintenance history
  date_acquired DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Integrated Student Fridge Checkouts
All 146 student fridge checkout records were migrated into the main `checkouts` and `items` tables:

**Checkouts Table:**
- Created 146 new checkout records for student fridge rentals
- Student name → `owner_name`
- Student email → `email`
- Housing assignment → `housing_assignment`
- All original data preserved in `notes` field including:
  - Original fridge_checkouts ID
  - Phone number
  - Student ID
  - Checkout notes
  - Return notes
  - Expected return date

**Items Table:**
- Created 163 item records for fridges
- Item name format: "Fridge #[number]"
- Description includes:
  - Brand, size, freezer status
  - Condition at checkout
  - Return date and condition (if returned)
  - Current status
- Verification status:
  - `approved` for returned fridges
  - `pending` for active rentals
  - `flagged` for lost/overdue

### 4. Maintenance History
- All maintenance records were appended to the `notes` field in the fridges table
- Format: "Maintenance History: [date]: [type] - [description] ($[cost])"

## Migration Results

- **Fridges migrated:** 180
- **Student checkout records migrated:** 146 → checkouts table
- **Fridge item records created:** 163 → items table
- **Maintenance records:** 0 (table was empty)

## Backup

A backup was created before migration:
- `database/reuse-store.db.backup-20260115-123651`

## What Needs To Be Updated

### Server Code (server/index.js)

The following endpoints reference old tables and need to be updated:

1. **Remove/Update Fridge-Specific Endpoints:**
   - ❌ `GET /api/fridges/checkouts/active` - No longer needed (use main checkouts)
   - ❌ `GET /api/fridges/student/:email` - No longer needed (use main checkouts filtered by email)
   - ❌ `POST /api/fridges/checkout` - Should create regular checkout + item instead
   - ❌ `POST /api/fridges/return` - Should update regular checkout/item instead
   - ✅ `GET /api/fridges` - Update to use new fridges table (remove fridge_inventory references)
   - ✅ `PATCH /api/fridges/:id` - Update to use new fridges table
   - ✅ `GET /api/fridges/stats` - Update to use new fridges table

2. **Search Functionality:**
   - Update search endpoint to query new fridges table structure

3. **Code Changes Required:**
   - Replace `fridge_inventory` → `fridges`
   - Replace `fridge_checkouts` → `checkouts` (filter by items with name like 'Fridge #%')
   - Remove `fridge_maintenance` references (now in fridges.notes)

### Frontend Code

Any frontend components that:
- Display fridge checkout history → should now show regular checkouts/items
- Show fridge-specific forms → should use regular checkout forms
- Query fridge-specific endpoints → should use main checkout/item endpoints

## Rollback Instructions

If you need to rollback:
```bash
cp database/reuse-store.db.backup-20260115-123651 database/reuse-store.db
```

## Benefits

1. **Simplified schema:** 4 tables → 1 table
2. **Unified data model:** Fridge checkouts are now regular checkouts (consistent UX)
3. **Easier queries:** No complex JOINs across multiple fridge tables
4. **Better reporting:** Fridge checkouts appear in main statistics/analytics
5. **Less code duplication:** Reuse existing checkout/item endpoints for fridges
