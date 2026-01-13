import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown, Tag, Plus } from 'lucide-react';
import Fuse from 'fuse.js';
import FormField from '../common/FormField';

function CategorySelector({
  value,
  onChange,
  categories = [],
  onCreateCategory,
  loading = false,
  error,
  disabled = false
}) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Set up fuzzy search
  const fuse = new Fuse(categories, {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true
  });

  // Update selected category when value changes externally
  useEffect(() => {
    if (value && value !== query) {
      const found = categories.find(cat => cat.name === value);
      if (found) {
        setSelectedCategory(found);
        setQuery(value);
      } else {
        setQuery(value);
      }
    }
  }, [value, categories]);

  // Filter categories using fuzzy search
  const filteredCategories = query === ''
    ? categories.sort((a, b) => b.timesUsed - a.timesUsed).slice(0, 10)
    : fuse.search(query).map(result => result.item).slice(0, 10);

  // Check if query is a potential new category
  const isNewCategory = query.trim().length > 0 &&
    !categories.find(cat => cat.name.toLowerCase() === query.toLowerCase());

  const handleSelect = (item) => {
    if (item === 'create-new') {
      // Create new category
      if (onCreateCategory && query.trim()) {
        onCreateCategory(query.trim());
        setQuery(query.trim());
        onChange(query.trim());
      }
    } else if (item) {
      // Select existing category
      setSelectedCategory(item);
      setQuery(item.name);
      onChange(item.name);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);

    // Clear selection if user modifies
    if (selectedCategory && selectedCategory.name !== newValue) {
      setSelectedCategory(null);
    }
  };

  return (
    <FormField
      label="Category"
      id="category"
      required
      error={error}
      helpText={loading ? 'Loading categories...' : 'Type to search or create new'}
    >
      <Combobox value={selectedCategory} onChange={handleSelect} disabled={disabled}>
        <div className="relative">
          <div className="relative">
            <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Combobox.Input
              className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-eco-primary-300 focus:ring-eco-primary-500'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Type to search categories..."
              value={query}
              onChange={handleInputChange}
              disabled={disabled}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronsUpDown className="w-5 h-5 text-gray-400" />
            </Combobox.Button>
          </div>

          <Combobox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 border border-gray-200 overflow-auto focus:outline-none">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Loading categories...
              </div>
            ) : (
              <>
                {filteredCategories.length === 0 && !isNewCategory ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {query ? 'No categories found. Keep typing to create new.' : 'Start typing to search...'}
                  </div>
                ) : (
                  <>
                    {filteredCategories.map((category) => (
                      <Combobox.Option
                        key={category.name}
                        value={category}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                            active ? 'bg-eco-primary-50 text-eco-primary-800' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center justify-between">
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {category.name}
                              </span>
                              <span className={`text-xs ${active ? 'text-eco-primary-600' : 'text-gray-400'}`}>
                                used {category.timesUsed} times
                              </span>
                            </div>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-eco-primary-600">
                                <Check className="w-5 h-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))}

                    {/* Create new category option */}
                    {isNewCategory && (
                      <Combobox.Option
                        value="create-new"
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-3 pl-10 pr-4 border-t border-gray-200 ${
                            active ? 'bg-eco-sky-light/20 text-eco-sky-dark' : 'text-eco-sky-DEFAULT'
                          }`
                        }
                      >
                        {({ active }) => (
                          <>
                            <div className="flex items-center gap-2">
                              <Plus className="w-4 h-4" />
                              <span className="font-medium">
                                Create new: "{query.trim()}"
                              </span>
                            </div>
                          </>
                        )}
                      </Combobox.Option>
                    )}
                  </>
                )}
              </>
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </FormField>
  );
}

export default CategorySelector;
