/**
 * Calculate Levenshtein distance between two strings
 * Used for typo detection and correction
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance between the strings
 */
export function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Search and filter items by query and categories
 * @param {Array} items - Array of inventory items
 * @param {string} query - Search query
 * @param {Array} selectedCategories - Array of selected categories to filter by
 * @returns {Array} Filtered items matching the search criteria
 */
export function searchItems(items, query, selectedCategories = []) {
  if (!items || items.length === 0) return [];

  let filtered = items;

  // Filter by categories first (if any selected)
  if (selectedCategories && selectedCategories.length > 0) {
    filtered = filtered.filter(item => {
      if (!item.categories) return false;
      return selectedCategories.some(cat => item.categories.includes(cat));
    });
  }

  // If no search query, return filtered by categories
  if (!query || query.trim() === '') {
    return filtered;
  }

  // Filter by search query (case-insensitive)
  const lowerQuery = query.toLowerCase().trim();

  filtered = filtered.filter(item => {
    const name = (item.name || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const sku = (item.sku || '').toLowerCase();

    return name.includes(lowerQuery) ||
           description.includes(lowerQuery) ||
           sku.includes(lowerQuery);
  });

  return filtered;
}

/**
 * Get autocomplete suggestions based on user input
 * @param {Array} items - Array of inventory items
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of suggestions to return
 * @returns {Array} Array of suggested item names
 */
export function getAutocompleteSuggestions(items, query, limit = 5) {
  if (!query || query.length < 2 || !items || items.length === 0) return [];

  const lowerQuery = query.toLowerCase().trim();
  const suggestions = [];

  // Find items that start with query (higher priority)
  const startsWith = items.filter(item => {
    const name = (item.name || '').toLowerCase();
    return name.startsWith(lowerQuery);
  });

  // Find items that contain query (lower priority)
  const contains = items.filter(item => {
    const name = (item.name || '').toLowerCase();
    return !name.startsWith(lowerQuery) && name.includes(lowerQuery);
  });

  // Combine results
  suggestions.push(...startsWith, ...contains);

  // Remove duplicates based on name and only show available items
  const unique = [];
  const seen = new Set();

  for (const item of suggestions) {
    if (!seen.has(item.name) && item.available > 0) {
      unique.push(item);
      seen.add(item.name);
    }
  }

  return unique.slice(0, limit);
}

/**
 * Suggest corrections for typos in search query
 * @param {Array} items - Array of inventory items
 * @param {string} query - Search query
 * @param {number} threshold - Maximum edit distance for suggestions (default: 2)
 * @returns {string|null} Suggested correction or null if no good match found
 */
export function suggestCorrections(items, query, threshold = 2) {
  if (!query || query.trim() === '' || !items || items.length === 0) return null;

  const lowerQuery = query.toLowerCase().trim();
  let bestMatch = null;
  let bestDistance = threshold + 1;

  // Extract unique words from item names
  const words = new Set();
  items.forEach(item => {
    const name = (item.name || '').toLowerCase();
    // Split by spaces and common separators
    name.split(/[\s\-/()]+/).forEach(word => {
      if (word.length > 2) { // Only consider words longer than 2 characters
        words.add(word);
      }
    });
  });

  // Find closest match
  words.forEach(word => {
    const distance = levenshteinDistance(lowerQuery, word);
    if (distance > 0 && distance <= threshold && distance < bestDistance) {
      bestMatch = word;
      bestDistance = distance;
    }
  });

  return bestMatch;
}

/**
 * Extract unique item names from inventory
 * @param {Array} items - Array of inventory items
 * @returns {Array} Array of unique item names
 */
export function getUniqueItemNames(items) {
  if (!items || items.length === 0) return [];

  const names = new Set();
  items.forEach(item => {
    if (item.name) {
      names.add(item.name);
    }
  });

  return Array.from(names).sort();
}

/**
 * Filter only available items
 * @param {Array} items - Array of inventory items
 * @returns {Array} Items with available > 0
 */
export function getAvailableItems(items) {
  if (!items || items.length === 0) return [];
  return items.filter(item => item.available && item.available > 0);
}
