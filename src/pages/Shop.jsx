import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ShopHeader from '../components/shop/ShopHeader';
import SearchBar from '../components/shop/SearchBar';
import CategoryFilter from '../components/shop/CategoryFilter';
import ItemGrid from '../components/shop/ItemGrid';
import TypoSuggestion from '../components/shop/TypoSuggestion';
import { searchItems, getAutocompleteSuggestions, suggestCorrections } from '../utils/searchUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function Shop() {
  const [inventory, setInventory] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typoSuggestion, setTypoSuggestion] = useState(null);

  // Debounce search input for better performance
  const debouncedSearchInput = useDebounce(searchInput, 300);

  // Load inventory data from API on mount
  useEffect(() => {
    const loadInventory = async () => {
      setIsLoading(true);
      try {
        // Fetch inventory from the real database API
        const response = await axios.get(`${API_URL}/inventory`);
        const items = response.data || [];

        // Fetch variants for each item and expand into separate cards
        const expandedItems = [];

        for (const item of items) {
          try {
            const variantsResponse = await axios.get(`${API_URL}/inventory/${item.id}/variants`);
            const variants = variantsResponse.data || [];

            if (variants.length > 0) {
              // If item has variants, show each variant as a separate card
              variants.forEach(variant => {
                if (variant.quantity > 0) { // Only show variants in stock
                  expandedItems.push({
                    id: `${item.id}-v${variant.id}`,
                    name: variant.variant_description, // Use variant description as the name
                    category: item.category || 'Other',
                    quantity: variant.quantity,
                    description: item.item_name, // Parent item name as description
                    image: item.image_url || '/placeholder-image.jpg',
                    available: variant.quantity,
                    isVariant: true,
                    parentId: item.id,
                    variantId: variant.id
                  });
                }
              });
            } else {
              // No variants, show the main item if it has quantity
              if (item.quantity > 0) {
                expandedItems.push({
                  id: item.id,
                  name: item.item_name,
                  category: item.category || 'Other',
                  quantity: item.quantity,
                  description: item.description || '',
                  image: item.image_url || '/placeholder-image.jpg',
                  available: item.quantity
                });
              }
            }
          } catch (error) {
            // If error fetching variants, just show the main item if it has quantity
            if (item.quantity > 0) {
              expandedItems.push({
                id: item.id,
                name: item.item_name,
                category: item.category || 'Other',
                quantity: item.quantity,
                description: item.description || '',
                image: item.image_url || '/placeholder-image.jpg',
                available: item.quantity
              });
            }
          }
        }

        setInventory(expandedItems);
      } catch (error) {
        console.error('Failed to load inventory:', error);
        setInventory([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInventory();
  }, []);

  // Get filtered items based on search and categories
  const filteredItems = useMemo(() => {
    const results = searchItems(inventory, debouncedSearchInput, selectedCategories);

    // Check for typo suggestions if no results found
    if (results.length === 0 && debouncedSearchInput.trim() !== '') {
      const suggestion = suggestCorrections(inventory, debouncedSearchInput);
      setTypoSuggestion(suggestion);
    } else {
      setTypoSuggestion(null);
    }

    return results;
  }, [inventory, debouncedSearchInput, selectedCategories]);

  // Get autocomplete suggestions
  const autocompleteSuggestions = useMemo(() => {
    if (searchInput.length < 2) return [];
    return getAutocompleteSuggestions(inventory, searchInput, 7);
  }, [inventory, searchInput]);

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Handle clear all categories
  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  // Handle suggestion click from autocomplete
  const handleSuggestionSelect = (name) => {
    setSearchInput(name);
  };

  // Handle typo suggestion click
  const handleTypoSuggestionClick = (suggestion) => {
    setSearchInput(suggestion);
    setTypoSuggestion(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <ShopHeader />

        {/* Search bar */}
        <div className="mb-6">
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            suggestions={autocompleteSuggestions}
            onSuggestionSelect={handleSuggestionSelect}
          />
        </div>

        {/* Category filter */}
        <CategoryFilter
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          onClearAll={handleClearCategories}
        />

        {/* Typo suggestion */}
        {typoSuggestion && (
          <TypoSuggestion
            originalQuery={debouncedSearchInput}
            suggestion={typoSuggestion}
            onSuggestionClick={handleTypoSuggestionClick}
          />
        )}

        {/* Item grid */}
        <ItemGrid
          items={filteredItems}
          isLoading={isLoading}
          searchQuery={debouncedSearchInput}
          hasFilters={selectedCategories.length > 0}
        />
      </div>
    </div>
  );
}

export default Shop;
