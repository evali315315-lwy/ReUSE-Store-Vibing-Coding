import { Check, X } from 'lucide-react';
import { CATEGORIES } from '../../utils/categories';

function CategorySelector({ itemName, onConfirm, onCancel }) {
  const handleCategorySelect = (category) => {
    onConfirm(category);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-eco-primary-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold mb-2">Select Category</h2>
          <p className="text-eco-primary-100">
            Choose a category for: <span className="font-semibold">{itemName}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 mb-4">
            Select the most appropriate category for this item:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-eco-primary-500 hover:bg-eco-primary-50 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 group-hover:text-eco-primary-900">
                    {category}
                  </span>
                  <Check className="w-5 h-5 text-eco-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategorySelector;
