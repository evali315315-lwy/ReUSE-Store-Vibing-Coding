import { useState, useEffect } from 'react';
import { Search, Package, Plus } from 'lucide-react';
import { checkinAPI } from '../../services/api';

function CheckInSearch({ onItemAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search as user types
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.length >= 2) {
        searchItems();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const searchItems = async () => {
    setLoading(true);
    try {
      const data = await checkinAPI.searchForCheckin(query);
      setResults(data);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (onItemAdd) {
      onItemAdd(item);
      setQuery('');
      setResults([]);
    }
  };

  const handleCreateNewItem = () => {
    if (onItemAdd && query.trim()) {
      // Pass a special object indicating this is a new item
      onItemAdd({
        isNew: true,
        name: query.trim(),
        type: 'item'
      });
      setQuery('');
      setResults([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Search Items to Check In
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-4 w-6 h-6 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item name or SKU..."
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-eco-primary-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-600 focus:border-transparent transition-all"
          />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Type at least 2 characters to search
        </p>
      </div>

      {/* Search Results */}
      {loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-primary-600 mx-auto mb-2"></div>
          Searching...
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No items found for "{query}"</p>
          <button
            type="button"
            onClick={handleCreateNewItem}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create new item: "{query}"
          </button>
          <p className="text-xs text-gray-500 mt-3">
            This will add "{query}" as a new inventory item
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {results.length} result(s) found
          </p>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => handleItemClick(item)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-eco-primary-500 hover:bg-eco-primary-50 transition-all text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Package className="w-6 h-6 text-eco-primary-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-eco-primary-900">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        SKU: {item.sku} • {item.category} • {item.current_quantity} in stock
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-eco-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to add →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckInSearch;
