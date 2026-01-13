// Category constants for inventory items
export const CATEGORIES = [
  "Kitchen appliance",
  "Household appliance",
  "Electronics",
  "Body and Hair Care",
  "Laundry",
  "Decorations and Dorm Supplies",
  "Mirrors",
  "Lamps",
  "Feminine Care",
  "Art and Music Supplies",
  "Other"
];

/**
 * Filter items by a specific category
 * @param {Array} items - Array of inventory items
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered items
 */
export function getItemsByCategory(items, category) {
  return items.filter(item => item.categories && item.categories.includes(category));
}

/**
 * Filter items by multiple categories (OR logic)
 * @param {Array} items - Array of inventory items
 * @param {Array} categories - Array of categories to filter by
 * @returns {Array} Filtered items that belong to any of the selected categories
 */
export function getItemsByCategories(items, categories) {
  if (!categories || categories.length === 0) {
    return items;
  }

  return items.filter(item => {
    if (!item.categories) return false;
    return categories.some(cat => item.categories.includes(cat));
  });
}

/**
 * Get count of items in each category
 * @param {Array} items - Array of inventory items
 * @returns {Object} Object with category names as keys and counts as values
 */
export function getCategoryCounts(items) {
  const counts = {};

  CATEGORIES.forEach(category => {
    counts[category] = getItemsByCategory(items, category).length;
  });

  return counts;
}
