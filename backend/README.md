# ReUSE Store Backend - SQLite + Node.js

This is an older backend implementation for the ReUSE Store application.

**Note:** The main application currently uses the API server at `server/index.js` in the project root, not this backend folder. This folder contains an alternative backend implementation that is not actively used.

## Current Active Backend

The active backend is located at:
- **Server**: `server/index.js` in the project root
- **Database**: `database/reuse-store.db`
- **Port**: 3001

To run the active backend:

```bash
# From project root
node server/index.js
```

Or use the npm script:
```bash
npm run server
```

Server will start at: http://localhost:3001

---

## Active API Endpoints

The current backend (server/index.js) provides these endpoints:

### Core

- **GET** `/api/health` - Health check
- **GET** `/api/years` - Get all year ranges
- **GET** `/api/statistics` - Get statistics (optional ?year=)

### Checkouts & Items

- **GET** `/api/checkouts` - Get checkouts (optional ?year=, ?page=, ?limit=)
- **GET** `/api/checkouts/:id` - Get checkout by ID with items
- **PATCH** `/api/checkouts/:id` - Update checkout information
- **GET** `/api/verification/checkouts` - Get grouped checkouts for verification
- **PATCH** `/api/verification/checkouts/:checkoutId` - Update checkout verification status

### Items

- **GET** `/api/items/search` - Search items (required ?query=)
- **PATCH** `/api/items/:id` - Update item information
- **GET** `/api/verification/items` - Get items for verification
- **PATCH** `/api/verification/items/:id` - Update item verification status

### Analytics

- **GET** `/api/analytics/top-items` - Get top items (optional ?year=)

### Donors & Categories

- **GET** `/api/donors/search` - Search donors (optional ?q=)
- **GET** `/api/categories` - Get all categories
- **POST** `/api/categories` - Create new category

### Fridge Management

- **GET** `/api/fridges` - Get all fridges (optional ?status=)
- **GET** `/api/fridges/:number` - Get fridge by number
- **PATCH** `/api/fridges/:id` - Update fridge
- **POST** `/api/fridges` - Add new fridge
- **GET** `/api/fridges/stats` - Get fridge statistics
- **GET** `/api/fridges/available` - Search available fridges
- **POST** `/api/fridges/checkout` - Checkout fridge to student
- **POST** `/api/fridges/return` - Return fridge from checkout
- **GET** `/api/fridges/checkouts/active` - Get active fridge checkouts
- **GET** `/api/fridges/student/:email` - Get student's checked out fridges

---

## Database Structure

The database is located at `database/reuse-store.db` in the project root.

### Tables

**checkouts**
- id (PRIMARY KEY)
- year_range - Academic year (e.g., "2024-2025")
- date - Checkout date
- owner_name - Donor name
- email - Donor email
- housing_assignment - Dorm/housing location
- graduation_year - Expected graduation year
- total_items - Number of items in checkout
- notes - Additional notes
- needs_approval - Whether checkout needs verification
- created_at

**items**
- id (PRIMARY KEY)
- checkout_id (FOREIGN KEY → checkouts)
- year_range - Academic year
- item_name - Name of the item
- item_quantity - Quantity
- verification_status - "pending", "approved", or "flagged"
- image_url - Photo URL
- flagged - Boolean flag
- verified_at - Verification timestamp
- verified_by - Staff member who verified
- description - Item description
- fridge_company_id (FOREIGN KEY → fridge_companies)
- created_at

**fridge_companies**
- id (PRIMARY KEY)
- company - Manufacturer/brand name
- model - Model number
- size - Fridge size
- condition - Condition status
- notes - Additional notes
- created_at

**fridges** (Consolidated from fridges, fridge_inventory, fridge_checkouts, fridge_maintenance)
- id (PRIMARY KEY)
- fridge_number (UNIQUE) - Fridge identifier (TEXT, e.g., "1", "2")
- brand - Manufacturer
- model - Model number
- size - "Mini", "Compact", "Standard"
- color - Fridge color
- has_freezer - Boolean (0 or 1)
- condition - "Good", "Fair", "Needs Repair"
- status - "available", "checked_out", "maintenance", "retired"
- notes - Additional notes (includes maintenance history)
- date_acquired - Purchase/acquisition date
- created_at
- updated_at

**Note:** Student fridge checkouts are now tracked in the main `checkouts` and `items` tables:
- Fridge checkouts have items with `item_name` like "Fridge #[number]"
- Student information stored in `checkouts` (owner_name, email, housing_assignment)
- Checkout notes contain original fridge_checkouts data for migrated records
- Maintenance history is stored in `fridges.notes` field

### View Database

```bash
# Open database
sqlite3 database/reuse-store.db

# View all tables
.tables

# View schema for a specific table
.schema checkouts
.schema items
.schema fridges

# Run queries
SELECT * FROM checkouts LIMIT 10;
SELECT * FROM items WHERE verification_status = 'pending' LIMIT 10;
SELECT COUNT(*) FROM fridges WHERE status = 'available';

# Get active fridge checkouts (from items table)
SELECT c.*, i.item_name
FROM checkouts c
JOIN items i ON i.checkout_id = c.id
WHERE i.item_name LIKE 'Fridge #%'
  AND i.verification_status = 'pending';

# Exit
.exit
```

---

## Testing the API

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Get Statistics
```bash
# Overall statistics
curl http://localhost:3001/api/statistics

# Statistics for specific year
curl "http://localhost:3001/api/statistics?year=2024-2025"
```

### Search Checkouts
```bash
# Get all checkouts
curl http://localhost:3001/api/checkouts

# Get checkouts for specific year
curl "http://localhost:3001/api/checkouts?year=2024-2025"

# Paginated results
curl "http://localhost:3001/api/checkouts?page=1&limit=50"
```

### Fridge Operations
```bash
# Get all fridges
curl http://localhost:3001/api/fridges

# Get available fridges
curl "http://localhost:3001/api/fridges?status=available"

# Get fridge statistics
curl http://localhost:3001/api/fridges/stats

# Get fridge by number
curl http://localhost:3001/api/fridges/1
```

---

## Troubleshooting

### Database locked error
- SQLite database can only have one writer at a time
- If you see "database is locked", make sure no other processes are using it
- Check for hanging processes: `lsof database/reuse-store.db`

### Port 3001 already in use
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Missing table error (e.g., "no such table: fridge_inventory")
**Note:** As of January 2026, `fridge_inventory`, `fridge_checkouts`, and `fridge_maintenance` tables have been consolidated into a single `fridges` table. If you encounter this error, your database is up to date - the old tables no longer exist.

Check current tables:
```bash
sqlite3 database/reuse-store.db ".tables"
```

You should see: `checkouts`, `fridge_companies`, `fridges`, `items`

For migration details, see `database/MIGRATION_SUMMARY.md`

---

## Alternative Backend (backend/ folder)

This folder contains an older backend implementation that uses a different schema (donors, categories, products). It is not currently in use. The schema files in `backend/src/db/` are for reference only.

If you need to use this alternative backend:
1. Install dependencies: `cd backend && npm install`
2. Note: Requires Node.js 18-20 (Node 25 has compatibility issues with better-sqlite3 v11.8.1)
3. Start server: `npm start` (runs on port 3000)
