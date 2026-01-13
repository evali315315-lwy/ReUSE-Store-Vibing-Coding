import { Filter, X } from 'lucide-react';
import { CATEGORIES } from '../../utils/categories';

function CategoryFilter({ selectedCategories, onCategoryToggle, onClearAll }) {
  const handleToggle = (category) => {
    onCategoryToggle(category);
  };

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-eco-primary-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filter by Category</h3>
        </div>
        {selectedCategories.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-sm text-eco-primary-600 hover:text-eco-primary-700 font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((category) => (
          <label
            key={category}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleToggle(category)}
                className="w-4 h-4 text-eco-primary-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-eco-primary-500 cursor-pointer"
              />
            </div>
            <span className="text-sm text-gray-700 group-hover:text-eco-primary-700 transition-colors select-none">
              {category}
            </span>
          </label>
        ))}
      </div>

      {/* Selected categories display */}
      {selectedCategories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">
            Active filters ({selectedCategories.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleToggle(category)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-eco-primary-100 text-eco-primary-700 rounded-full text-sm font-medium hover:bg-eco-primary-200 transition-colors"
              >
                {category}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryFilter;
