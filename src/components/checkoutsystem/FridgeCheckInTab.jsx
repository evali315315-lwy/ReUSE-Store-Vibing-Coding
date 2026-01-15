import { useState } from 'react';
import { Calendar, Snowflake, Box, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import AddAttributeModal from './AddAttributeModal';
import BrandSearch from './BrandSearch';
import { useFridgeAttributes } from '../../hooks/useFridgeAttributes';
import { fridgeAPI } from '../../services/api';

function FridgeCheckInTab() {
  const { attributes, loading: loadingAttributes, addSize, addColor, addBrand, addCondition } = useFridgeAttributes();
  const [hasFreezer, setHasFreezer] = useState(null); // null, true, or false
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'size', 'color', 'brand', 'condition'

  const currentDate = new Date().toLocaleDateString();

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
  };

  const handleAddAttribute = async (value) => {
    switch (modalType) {
      case 'size':
        await addSize(value);
        setSize(value); // Auto-select the newly added attribute
        break;
      case 'color':
        await addColor(value);
        setColor(value);
        break;
      case 'brand':
        await addBrand(value);
        setBrand(value);
        break;
      case 'condition':
        await addCondition(value);
        setCondition(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasFreezer === null) {
      toast.error('Please select fridge type (with or without freezer)');
      return;
    }

    if (!brand) {
      toast.error('Please select a brand');
      return;
    }

    setSubmitting(true);

    try {
      const result = await fridgeAPI.checkinFridge({
        hasFreezer,
        size: size || null,
        color: color || null,
        brand,
        condition: condition || 'Good',
        notes: notes || null,
        checkedInBy: 'worker@haverford.edu' // TODO: Get from auth context
      });

      toast.success(`Fridge #${result.fridgeNumber} checked in successfully!`);

      // Reset form
      setHasFreezer(null);
      setSize('');
      setColor('');
      setBrand('');
      setCondition('Good');
      setNotes('');
    } catch (error) {
      console.error('Fridge check-in error:', error);
      toast.error(error.response?.data?.error || 'Failed to check in fridge');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <Snowflake className="w-6 h-6" />
          Fridge Check-In
        </h2>
        <p className="text-sm text-blue-700 mt-1">Date: {currentDate}</p>
        <p className="text-xs text-blue-600 mt-2">
          Add new fridges to inventory
        </p>
      </div>

      {/* Fridge Type - REQUIRED and PROMINENT */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3">
            Fridge Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setHasFreezer(true)}
              className={`p-6 border-2 rounded-lg transition-all flex flex-col items-center gap-3 ${
                hasFreezer === true
                  ? 'border-blue-600 bg-blue-100 text-blue-900 shadow-md'
                  : 'border-gray-300 bg-white hover:border-blue-400'
              }`}
            >
              <Snowflake className="w-10 h-10" />
              <span className="font-semibold text-xl">With Freezer</span>
              <span className="text-xs text-gray-600">Includes freezer compartment</span>
            </button>

            <button
              type="button"
              onClick={() => setHasFreezer(false)}
              className={`p-6 border-2 rounded-lg transition-all flex flex-col items-center gap-3 ${
                hasFreezer === false
                  ? 'border-blue-600 bg-blue-100 text-blue-900 shadow-md'
                  : 'border-gray-300 bg-white hover:border-blue-400'
              }`}
            >
              <Box className="w-10 h-10" />
              <span className="font-semibold text-xl">Without Freezer</span>
              <span className="text-xs text-gray-600">Refrigerator only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fridge Attributes - Only show after fridge type is selected */}
      {hasFreezer !== null && (
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Fridge Attributes</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingAttributes}
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
                <div className="flex gap-2">
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingAttributes}
                  >
                    <option value="">-- Select color --</option>
                    {attributes.colors.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openModal('color')}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Add new color"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Brand - Searchable */}
              <div>
                <BrandSearch
                  value={brand}
                  onChange={setBrand}
                  brands={attributes.brands}
                  onAddNew={(newBrand) => {
                    addBrand(newBrand);
                    setBrand(newBrand);
                  }}
                  required
                />
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
                  disabled={loadingAttributes}
                >
                  {attributes.conditions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              * Only color and brand can have new options added
            </p>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes about this fridge..."
            />
          </div>
        </>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || hasFreezer === null || !brand}
        className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {submitting ? 'Processing...' : 'Check In Fridge'}
      </button>

      {(hasFreezer === null || !brand) && (
        <p className="text-center text-sm text-gray-500">
          Please select fridge type and brand to check in
        </p>
      )}

      {/* Add Attribute Modal */}
      <AddAttributeModal
        isOpen={modalOpen}
        onClose={closeModal}
        attributeType={modalType}
        onAdd={handleAddAttribute}
      />
    </form>
  );
}

export default FridgeCheckInTab;
