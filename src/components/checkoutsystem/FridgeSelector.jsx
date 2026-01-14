import { useState, useEffect } from 'react';
import { Snowflake, Box } from 'lucide-react';
import { useFridgeAttributes } from '../../hooks/useFridgeAttributes';
import { fridgeAPI } from '../../services/api';

function FridgeSelector({ onFridgeSelect, disabled = false }) {
  const { attributes, loading: loadingAttributes } = useFridgeAttributes();
  const [hasFreezer, setHasFreezer] = useState(null); // null, true, or false
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
  const [availableFridges, setAvailableFridges] = useState([]);
  const [selectedFridge, setSelectedFridge] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch available fridges when freezer type is selected
  useEffect(() => {
    if (hasFreezer !== null) {
      fetchAvailableFridges();
    }
  }, [hasFreezer]);

  const fetchAvailableFridges = async () => {
    setLoading(true);
    try {
      const fridges = await fridgeAPI.getAvailableFridges(hasFreezer);
      setAvailableFridges(fridges);
    } catch (error) {
      console.error('Error fetching fridges:', error);
      setAvailableFridges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFridge = () => {
    if (hasFreezer === null) {
      alert('Please select fridge type (with or without freezer)');
      return;
    }

    if (selectedFridge && onFridgeSelect) {
      onFridgeSelect({
        id: selectedFridge.id,
        fridgeNumber: selectedFridge.fridge_number,
        hasFreezer,
        size: selectedFridge.size || size,
        color: selectedFridge.color || color,
        brand: selectedFridge.brand || brand,
        condition: selectedFridge.condition || condition,
        notes
      });

      // Reset form
      setHasFreezer(null);
      setSize('');
      setColor('');
      setBrand('');
      setCondition('Good');
      setNotes('');
      setSelectedFridge(null);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
      <h3 className="font-semibold text-lg text-blue-900 flex items-center gap-2">
        <Snowflake className="w-5 h-5" />
        Fridge Selection
      </h3>

      {/* Fridge Type - REQUIRED and PROMINENT */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">
          Fridge Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setHasFreezer(true)}
            disabled={disabled}
            className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-2 ${
              hasFreezer === true
                ? 'border-blue-600 bg-blue-100 text-blue-900 shadow-md'
                : 'border-gray-300 bg-white hover:border-blue-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Snowflake className="w-8 h-8" />
            <span className="font-semibold text-lg">With Freezer</span>
            <span className="text-xs text-gray-600">Includes freezer compartment</span>
          </button>

          <button
            type="button"
            onClick={() => setHasFreezer(false)}
            disabled={disabled}
            className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-2 ${
              hasFreezer === false
                ? 'border-blue-600 bg-blue-100 text-blue-900 shadow-md'
                : 'border-gray-300 bg-white hover:border-blue-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Box className="w-8 h-8" />
            <span className="font-semibold text-lg">Without Freezer</span>
            <span className="text-xs text-gray-600">Refrigerator only</span>
          </button>
        </div>
      </div>

      {hasFreezer !== null && (
        <>
          {/* Available Fridges */}
          {loading ? (
            <div className="text-sm text-gray-500">Loading available fridges...</div>
          ) : availableFridges.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Available Fridge
              </label>
              <select
                value={selectedFridge?.id || ''}
                onChange={(e) => {
                  const fridge = availableFridges.find(f => f.id === parseInt(e.target.value));
                  setSelectedFridge(fridge);
                  if (fridge) {
                    setSize(fridge.size || '');
                    setColor(fridge.color || '');
                    setBrand(fridge.brand || '');
                    setCondition(fridge.condition || 'Good');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              >
                <option value="">-- Select a fridge --</option>
                {availableFridges.map((fridge) => (
                  <option key={fridge.id} value={fridge.id}>
                    Fridge #{fridge.fridge_number} - {fridge.brand} ({fridge.condition})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {availableFridges.length} fridge(s) available
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
              No fridges available with this freezer type. Admin can add new fridges.
            </div>
          )}

          {/* Fridge Attributes */}
          <div className="grid grid-cols-2 gap-4">
            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled || loadingAttributes}
              >
                <option value="">-- Select size --</option>
                {attributes.sizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled || loadingAttributes}
              >
                <option value="">-- Select color --</option>
                {attributes.colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled || loadingAttributes}
              >
                <option value="">-- Select brand --</option>
                {attributes.brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled || loadingAttributes}
              >
                {attributes.conditions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes about this fridge..."
              disabled={disabled}
            />
          </div>

          {/* Add Fridge Button */}
          <button
            type="button"
            onClick={handleAddFridge}
            disabled={disabled || !selectedFridge}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {selectedFridge ? 'Add Fridge to Checkout' : 'Select a fridge first'}
          </button>
        </>
      )}
    </div>
  );
}

export default FridgeSelector;
