# Fridge Schema Documentation

## Overview
The database now has a dedicated `fridges` table to store fridge-specific information. Items in the `items` table that are fridges now reference this table via a `fridge_id` foreign key.

## Database Schema

### fridges Table
```sql
CREATE TABLE fridges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,           -- Fridge manufacturer/brand (e.g., "Sunbeam", "Haier")
  model TEXT,                       -- Model number/name (optional)
  size TEXT,                        -- Size description (optional)
  condition TEXT,                   -- Condition description (optional)
  notes TEXT,                       -- Additional notes (optional)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### items Table (Updated)
- Added column: `fridge_id INTEGER REFERENCES fridges(id) ON DELETE SET NULL`
- When an item is a fridge, its `fridge_id` links to the `fridges` table
- If the fridge record is deleted, `fridge_id` is set to NULL (item remains)

## Data Migration

### Existing Data
All existing fridge items have been migrated:
- **Total fridges**: 11 unique companies
- **Items linked**: 122 fridge items

### Company Distribution
1. Insignia: 27 items
2. Haier: 20 items
3. Sunbeam: 18 items
4. Danby: 14 items
5. Midea: 12 items
6. Kenmore: 8 items
7. Avanti: 7 items
8. Igloo: 6 items
9. Daewoo: 5 items
10. Avalon: 3 items
11. White: 2 items

## API Updates

### GET /api/checkouts
Now returns items with fridge information:
```json
{
  "checkouts": [
    {
      "id": 1,
      "owner_name": "John Doe",
      "items": [
        {
          "id": 1,
          "item_name": "Fridge (Sunbeam)",
          "fridge_id": 1,
          "fridge_company": "Sunbeam",
          "fridge_model": null,
          "fridge_size": null,
          "fridge_condition": null
        }
      ]
    }
  ]
}
```

### GET /api/verification/checkouts
Also includes fridge information with items.

## Frontend Updates

### DatabaseViewer Component
The modal now displays fridge company information when viewing checkout details:

**Fridge Items Section:**
- Item name (e.g., "Fridge (Sunbeam)")
- Company: Bold text showing manufacturer
- Model: If available
- Size: If available
- Condition: If available
- Description: If available

## Adding New Fridges

### When Processing New Items
1. Check if item name contains "fridge" or "refrigerator"
2. Extract company name from parentheses: `Fridge (CompanyName)`
3. Check if company already exists in `fridges` table
4. If not, insert new fridge record
5. Set `fridge_id` on the item

### Example SQL
```sql
-- Insert new fridge company
INSERT INTO fridges (company) VALUES ('NewBrand');

-- Link item to fridge
UPDATE items
SET fridge_id = (SELECT id FROM fridges WHERE company = 'NewBrand')
WHERE id = 123;
```

## Benefits of New Schema

1. **Normalized Data**: Company names stored once, not repeated
2. **Extended Information**: Can add model, size, condition details
3. **Easier Queries**: Simple to get all items for a specific brand
4. **Data Consistency**: Single source of truth for fridge information
5. **Flexibility**: Can add more fridge-specific fields without modifying items table

## Future Enhancements

Consider adding:
- `fridges.warranty_info TEXT` - Warranty details
- `fridges.energy_rating TEXT` - Energy efficiency rating
- `fridges.capacity TEXT` - Storage capacity
- `fridges.year_manufactured INTEGER` - Manufacturing year
- `fridges.purchase_date DATE` - When acquired by store
