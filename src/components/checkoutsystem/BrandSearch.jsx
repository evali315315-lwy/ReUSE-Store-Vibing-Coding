import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check } from 'lucide-react';

function BrandSearch({ value, onChange, brands, onAddNew, required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const wrapperRef = useRef(null);

  // Filter brands based on search query - prefix match only (starts with)
  const filteredBrands = brands.filter(brand =>
    brand.toLowerCase().startsWith(query.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange(newQuery);
    setIsOpen(true);
  };

  const handleBrandSelect = (brand) => {
    setQuery(brand);
    onChange(brand);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    if (query.trim() && onAddNew) {
      onAddNew(query.trim());
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const isExactMatch = brands.some(b => b.toLowerCase() === query.toLowerCase());

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Brand {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder="Search or type brand name..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={required}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 border border-gray-200 overflow-auto">
          {filteredBrands.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs text-gray-500 font-medium">
                {filteredBrands.length} brand(s) found
              </div>
              {filteredBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandSelect(brand)}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                    brand === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{brand}</span>
                    {brand === value && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>
              ))}
            </>
          ) : query.length >= 2 ? (
            <div className="px-4 py-3">
              <p className="text-sm text-gray-500 mb-3">No brand found for "{query}"</p>
              {onAddNew && (
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add "{query}" as new brand
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}

      {/* Selected brand indicator */}
      {value && isExactMatch && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          <span>Selected: {value}</span>
        </div>
      )}

      {/* New brand indicator */}
      {value && !isExactMatch && value.length >= 2 && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
          <Plus className="w-4 h-4" />
          <span>New brand will be added: {value}</span>
        </div>
      )}
    </div>
  );
}

export default BrandSearch;
