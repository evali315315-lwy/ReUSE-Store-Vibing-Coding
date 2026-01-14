import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { Package, ChevronsUpDown, Check } from 'lucide-react';
import { useInventorySearch } from '../../hooks/useInventorySearch';

function ItemSearch({ onItemSelect, selectedItems = [], disabled = false }) {
  const [query, setQuery] = useState('');
  const { items, loading, searchItems } = useInventorySearch();

  // Search as user types
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.length >= 0) {
        searchItems(query);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, searchItems]);

  // Filter out already selected items
  const availableItems = items.filter(
    item => !selectedItems.find(selected => selected.id === item.id)
  );

  const filteredItems = query === ''
    ? availableItems.slice(0, 10)
    : availableItems.slice(0, 10);

  const handleSelect = (item) => {
    if (item && onItemSelect) {
      onItemSelect(item);
      setQuery(''); // Clear search after selection
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Search Items
      </label>
      <Combobox value={null} onChange={handleSelect} disabled={disabled}>
        <div className="relative">
          <div className="relative">
            <Package className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Combobox.Input
              className={`w-full pl-10 pr-10 py-3 border border-eco-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500 transition-all ${
                disabled ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="Type to search items by name or SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={disabled}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronsUpDown className="w-5 h-5 text-gray-400" />
            </Combobox.Button>
          </div>

          <Combobox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 border border-gray-200 overflow-auto focus:outline-none">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Searching inventory...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {query === '' ? 'Type to search items' : 'No available items found'}
              </div>
            ) : (
              filteredItems.map((item) => (
                <Combobox.Option
                  key={item.id}
                  value={item}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                      active ? 'bg-eco-primary-50 text-eco-primary-900' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex justify-between">
                        <div>
                          <span className="block font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500">
                            SKU: {item.sku} • Category: {item.category}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-eco-primary-600">
                          {item.available_quantity} available
                        </span>
                      </div>
                      {selected && (
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? 'text-eco-primary-600' : 'text-eco-primary-600'
                        }`}>
                          <Check className="w-5 h-5" />
                        </span>
                      )}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
      <p className="mt-1 text-sm text-gray-500">
        {availableItems.length} items available for checkout
      </p>
    </div>
  );
}

export default ItemSearch;
