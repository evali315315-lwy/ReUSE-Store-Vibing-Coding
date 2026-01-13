import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

function SearchBar({ value, onChange, suggestions, onSuggestionSelect }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show suggestions when there are any and input is focused
  useEffect(() => {
    if (suggestions && suggestions.length > 0 && value.length >= 2) {
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions, value]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || !suggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (item) => {
    onSuggestionSelect(item.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle clear button
  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="w-full pl-11 pr-10 py-3 border border-eco-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500 focus:border-transparent"
          placeholder="Search for items... (e.g., lamp, kettle, body wash)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions && suggestions.length > 0 && value.length >= 2) {
              setShowSuggestions(true);
            }
          }}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleSuggestionClick(item)}
              className={`w-full text-left px-4 py-3 hover:bg-eco-primary-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-eco-primary-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-xs text-eco-primary-600 font-semibold">
                  {item.available} available
                </span>
              </div>
              {item.categories && item.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.categories.slice(0, 2).map((category, catIndex) => (
                    <span
                      key={catIndex}
                      className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
