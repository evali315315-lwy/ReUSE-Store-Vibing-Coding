import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

function AddAttributeModal({ isOpen, onClose, attributeType, onAdd }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const attributeLabels = {
    size: 'Size',
    color: 'Color',
    brand: 'Brand',
    condition: 'Condition'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!value.trim()) {
      toast.error(`Please enter a ${attributeLabels[attributeType].toLowerCase()}`);
      return;
    }

    setSubmitting(true);

    try {
      await onAdd(value.trim());
      toast.success(`${attributeLabels[attributeType]} added successfully!`);
      setValue('');
      onClose();
    } catch (error) {
      console.error('Error adding attribute:', error);
      if (error.response?.status === 409) {
        toast.error(`This ${attributeLabels[attributeType].toLowerCase()} already exists`);
      } else {
        toast.error(`Failed to add ${attributeLabels[attributeType].toLowerCase()}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setValue('');
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New {attributeLabels[attributeType]}
            </h3>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {attributeLabels[attributeType]} Name
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter ${attributeLabels[attributeType].toLowerCase()} name...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                disabled={submitting}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !value.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddAttributeModal;
