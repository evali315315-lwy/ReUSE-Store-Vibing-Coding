import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function VariantSelector({ item, onConfirm, onCancel }) {
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [customVariant, setCustomVariant] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVariants();
  }, [item.id]);

  const fetchVariants = async () => {
    try {
      const response = await axios.get(`${API_URL}/inventory/${item.id}/variants`);
      setVariants(response.data || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setShowCustomInput(false);
    setCustomVariant('');
  };

  const handleCustomVariantToggle = () => {
    setShowCustomInput(true);
    setSelectedVariant(null);
  };

  const handleConfirm = () => {
    let variantDescription = null;

    if (selectedVariant) {
      variantDescription = selectedVariant.variant_description;
    } else if (showCustomInput && customVariant.trim()) {
      variantDescription = customVariant.trim();
    }

    onConfirm({
      ...item,
      variantDescription,
      variantId: selectedVariant?.id || null
    });
  };

  const handleSkipVariant = () => {
    // Add item without variant
    onConfirm({
      ...item,
      variantDescription: null,
      variantId: null
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-eco-primary-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold mb-2">Select Variant</h2>
          <p className="text-eco-primary-100">
            {item.item_name || item.name}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading variants...</p>
            </div>
          ) : (
            <>
              {/* Existing Variants */}
              {variants.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select from existing types:
                  </h3>
                  <div className="grid gap-3">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantSelect(variant)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'border-eco-primary-600 bg-eco-primary-50'
                            : 'border-gray-200 hover:border-eco-primary-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {variant.variant_description}
                            </p>
                            <p className="text-sm text-gray-600">
                              {variant.quantity} in stock
                            </p>
                          </div>
                          {selectedVariant?.id === variant.id && (
                            <Check className="w-6 h-6 text-eco-primary-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Variant Input */}
              <div className="space-y-3">
                {!showCustomInput ? (
                  <button
                    onClick={handleCustomVariantToggle}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-eco-primary-400 hover:bg-eco-primary-50 transition-all text-gray-600 hover:text-eco-primary-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add new variant type
                  </button>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom variant description:
                    </label>
                    <input
                      type="text"
                      value={customVariant}
                      onChange={(e) => setCustomVariant(e.target.value)}
                      placeholder="e.g., Portable Fan, Ceiling Fan, etc."
                      className="w-full px-4 py-3 border-2 border-eco-primary-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-600"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500">
                      This will be saved for future check-ins
                    </p>
                  </div>
                )}
              </div>

              {/* No Variant Option */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSkipVariant}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Skip - Don't specify a variant type
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedVariant && (!showCustomInput || !customVariant.trim())}
            className="px-6 py-2 bg-eco-primary-600 text-white rounded-lg hover:bg-eco-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default VariantSelector;
