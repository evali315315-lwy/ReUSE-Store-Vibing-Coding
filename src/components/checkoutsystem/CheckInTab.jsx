import { useState } from 'react';
import { Calendar, Plus, Trash2, Save, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import CheckInSearch from './CheckInSearch';
import { checkinAPI, inventoryAPI } from '../../services/api';

function CheckInTab() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentDate = new Date().toLocaleDateString();

  // Handle item addition from search
  const handleItemAdd = async (item) => {
    // Check if this is a new item that needs to be created
    if (item.isNew) {
      try {
        toast.loading('Creating new item...', { id: 'create-item' });

        // Create the new item in the database
        const newItem = await inventoryAPI.createItem({
          name: item.name,
          category: 'Other',
          quantity: 1,
          createdBy: 'worker@haverford.edu' // TODO: Get from auth context
        });

        toast.success('New item created!', { id: 'create-item' });

        // Add the newly created item to selected items
        setSelectedItems([...selectedItems, { ...newItem, type: 'item', quantity: 1 }]);
      } catch (error) {
        console.error('Error creating item:', error);
        toast.error(error.response?.data?.error || 'Failed to create item', { id: 'create-item' });
      }
      return;
    }

    // Check if item already added
    const exists = selectedItems.find(i =>
      i.type === item.type && i.id === item.id
    );

    if (exists) {
      toast.info('Item already added. Adjust quantity below.');
      return;
    }

    // Add item with default quantity of 1
    setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    toast.success(`Added ${item.type === 'fridge' ? `Fridge #${item.fridge_number}` : item.name}`);
  };

  // Update item quantity
  const updateQuantity = (index, quantity) => {
    setSelectedItems(items =>
      items.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) } : item
      )
    );
  };

  // Remove item
  const removeItem = (index) => {
    setSelectedItems(items => items.filter((_, i) => i !== index));
  };

  // Submit check-in
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to check in');
      return;
    }

    setSubmitting(true);

    try {
      const checkinData = {
        items: selectedItems.map(item => ({
          type: 'item',
          itemId: item.id,
          quantity: item.quantity
        })),
        checkedInBy: 'worker@haverford.edu', // TODO: Get from auth context
        notes: notes || null
      };

      const result = await checkinAPI.createCheckin(checkinData);

      toast.success('Items checked in successfully!');

      // Reset form
      setSelectedItems([]);
      setNotes('');

    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.response?.data?.error || 'Failed to check in items');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Check-In Items
        </h2>
        <p className="text-sm text-green-700 mt-1">Date: {currentDate}</p>
        <p className="text-xs text-green-600 mt-2">
          No personal information needed - just search and add items
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <CheckInSearch onItemAdd={handleItemAdd} />
      </div>

      {/* Selected Items for Check-In */}
      {selectedItems.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Items to Check In ({selectedItems.length})
          </h3>

          <div className="space-y-3">
            {selectedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <Package className="w-8 h-8 text-eco-primary-600" />
                </div>

                {/* Item Details */}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    SKU: {item.sku} • {item.category}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                  />
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              Total Items: <span className="text-eco-primary-600 font-bold">{selectedItems.length}</span>
            </p>
            <p className="text-sm text-gray-600">
              Total Quantity: <span className="font-semibold">
                {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
          placeholder="Any additional notes about this check-in..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || selectedItems.length === 0}
        className="w-full py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {submitting ? 'Processing...' : 'Complete Check-In'}
      </button>

      {selectedItems.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          Search and add items above to check them in
        </p>
      )}
    </form>
  );
}

export default CheckInTab;
