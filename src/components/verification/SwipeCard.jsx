import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Flag, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const SwipeCard = ({ data, onSwipeLeft, onSwipeRight, onDataUpdate }) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  // Editable fields
  const [editedData, setEditedData] = useState({
    donorName: data.donorName || '',
    donorEmail: data.donorEmail || '',
    housingAssignment: data.housingAssignment || '',
    graduationYear: data.graduationYear || ''
  });
  const [editedItems, setEditedItems] = useState(data.items || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState(null); // Track which field is being edited (e.g., 'donorName', 'item-0-name', 'item-0-quantity')
  const [itemSuggestions, setItemSuggestions] = useState([]); // Autocomplete suggestions for item names
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Reset edited data when data prop changes
  useEffect(() => {
    setEditedData({
      donorName: data.donorName || '',
      donorEmail: data.donorEmail || '',
      housingAssignment: data.housingAssignment || '',
      graduationYear: data.graduationYear || ''
    });
    setEditedItems(data.items || []);
    setHasChanges(false);
    setEditingField(null);
  }, [data]);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setCurrentX(touch.clientX - startX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 100; // pixels to swipe before action

    if (currentX > threshold) {
      // Swiped right - mark as flagged
      onSwipeRight();
    } else if (currentX < -threshold) {
      // Swiped left - mark as checked
      onSwipeLeft();
    }

    // Reset position
    setCurrentX(0);
  };

  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setCurrentX(e.clientX - startX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const threshold = 100;

    if (currentX > threshold) {
      onSwipeRight();
    } else if (currentX < -threshold) {
      onSwipeLeft();
    }

    setCurrentX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setCurrentX(0);
    }
  };

  const getRotation = () => {
    return currentX * 0.1; // Slight rotation based on drag
  };

  const getOpacity = () => {
    return 1 - Math.abs(currentX) / 500;
  };

  const handleFieldClick = (field, e) => {
    e.stopPropagation();
    setEditingField(field);
  };

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleItemFieldChange = async (itemIndex, field, value) => {
    setEditedItems(prev => {
      const newItems = [...prev];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
      return newItems;
    });
    setHasChanges(true);

    // If editing item name and value has 2+ characters, search for suggestions
    if (field === 'name' && value.length >= 2) {
      try {
        const response = await axios.get(`${API_URL}/items/search`, {
          params: { query: value, limit: 10 }
        });

        // Extract unique item names from results
        const uniqueNames = [...new Set(response.data.map(item => item.item_name))];
        setItemSuggestions(uniqueNames);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching item suggestions:', error);
        setItemSuggestions([]);
      }
    } else if (field === 'name' && value.length < 2) {
      setItemSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (itemIndex, suggestedName) => {
    setEditedItems(prev => {
      const newItems = [...prev];
      newItems[itemIndex] = { ...newItems[itemIndex], name: suggestedName };
      return newItems;
    });
    setHasChanges(true);
    setShowSuggestions(false);
    setItemSuggestions([]);
    setEditingField(null);
  };

  const handleFieldBlur = () => {
    // Don't close editing if user is typing or selecting suggestion
    setTimeout(() => {
      setEditingField(null);
      setShowSuggestions(false);
    }, 200);
  };

  const handleSaveChanges = async (e) => {
    e.stopPropagation();
    setIsSaving(true);

    try {
      // Update checkout information
      await axios.patch(`${API_URL}/checkouts/${data.checkoutId}`, {
        owner_name: editedData.donorName,
        email: editedData.donorEmail,
        housing_assignment: editedData.housingAssignment,
        graduation_year: editedData.graduationYear
      });

      // Update items
      await Promise.all(
        editedItems.map(item =>
          axios.patch(`${API_URL}/items/${item.id}`, {
            item_name: item.name,
            description: item.description,
            item_quantity: item.quantity
          })
        )
      );

      toast.success('Changes saved successfully');
      setHasChanges(false);
      setEditingField(null);

      // Notify parent component to refresh data
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Swipe Indicators */}
      <div className="absolute inset-0 pointer-events-none z-10 flex justify-between items-center px-8">
        {/* Left indicator (Check) */}
        <div
          className={`transition-opacity duration-200 ${
            currentX < -50 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-eco-primary-500 text-white p-4 rounded-full shadow-lg">
            <Check size={48} />
          </div>
        </div>

        {/* Right indicator (Flag) */}
        <div
          className={`transition-opacity duration-200 ${
            currentX > 50 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-red-500 text-white p-4 rounded-full shadow-lg">
            <Flag size={48} />
          </div>
        </div>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="card cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-2xl"
        style={{
          transform: `translateX(${currentX}px) rotate(${getRotation()}deg)`,
          opacity: getOpacity(),
          transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-eco-primary-800">
              Primary Photo
            </h3>
            <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
              {data.items && data.items.length > 0 && data.items[0].imageUrl ? (
                <img
                  src={data.items[0].imageUrl}
                  alt="First item"
                  className="w-full h-full object-cover"
                  draggable="false"
                />
              ) : data.imageUrl ? (
                <img
                  src={data.imageUrl}
                  alt="Donation"
                  className="w-full h-full object-cover"
                  draggable="false"
                />
              ) : (
                <div className="text-gray-400 text-center p-8">
                  <p>No image available</p>
                </div>
              )}
            </div>
            {data.items && data.items.length > 1 && (
              <p className="text-sm text-gray-600 text-center">
                +{data.items.length - 1} more {data.items.length === 2 ? 'item' : 'items'} in this checkout
              </p>
            )}

            {/* Save Changes Button */}
            {hasChanges && (
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-eco-primary-600 text-white rounded-lg hover:bg-eco-primary-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                <span className="font-medium">{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>

          {/* Information Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-eco-primary-800">
              Checkout Session Information
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Timestamp</label>
                <p className="text-gray-900 mt-1">{data.timestamp}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Donor Name</label>
                {editingField === 'donorName' ? (
                  <input
                    type="text"
                    value={editedData.donorName}
                    onChange={(e) => handleFieldChange('donorName', e.target.value)}
                    onBlur={handleFieldBlur}
                    autoFocus
                    className="w-full mt-1 px-3 py-2 border border-eco-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p
                    onClick={(e) => handleFieldClick('donorName', e)}
                    className="text-gray-900 mt-1 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    {editedData.donorName}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Donor Email</label>
                {editingField === 'donorEmail' ? (
                  <input
                    type="email"
                    value={editedData.donorEmail}
                    onChange={(e) => handleFieldChange('donorEmail', e.target.value)}
                    onBlur={handleFieldBlur}
                    autoFocus
                    className="w-full mt-1 px-3 py-2 border border-eco-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p
                    onClick={(e) => handleFieldClick('donorEmail', e)}
                    className="text-gray-900 mt-1 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    {editedData.donorEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Housing Assignment</label>
                {editingField === 'housingAssignment' ? (
                  <input
                    type="text"
                    value={editedData.housingAssignment}
                    onChange={(e) => handleFieldChange('housingAssignment', e.target.value)}
                    onBlur={handleFieldBlur}
                    autoFocus
                    placeholder="Optional"
                    className="w-full mt-1 px-3 py-2 border border-eco-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p
                    onClick={(e) => handleFieldClick('housingAssignment', e)}
                    className="text-gray-900 mt-1 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    {editedData.housingAssignment || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Graduation Year</label>
                {editingField === 'graduationYear' ? (
                  <input
                    type="text"
                    value={editedData.graduationYear}
                    onChange={(e) => handleFieldChange('graduationYear', e.target.value)}
                    onBlur={handleFieldBlur}
                    autoFocus
                    placeholder="Optional"
                    className="w-full mt-1 px-3 py-2 border border-eco-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p
                    onClick={(e) => handleFieldClick('graduationYear', e)}
                    className="text-gray-900 mt-1 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    {editedData.graduationYear || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Total Items in Session</label>
                <p className="text-gray-900 mt-1 font-semibold">{data.totalItems || data.items?.length || 0}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Checkout ID</label>
                <p className="text-gray-900 mt-1 font-mono text-sm">{data.checkoutId}</p>
              </div>

              {/* Items List */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Items in this checkout:</label>
                <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-3">
                  {editedItems && editedItems.length > 0 ? (
                    editedItems.map((item, index) => (
                      <div key={item.id || index} className="bg-white p-3 rounded-md border border-gray-200">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 space-y-2">
                            {/* Item Name */}
                            <div className="relative">
                              {editingField === `item-${index}-name` ? (
                                <>
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handleItemFieldChange(index, 'name', e.target.value)}
                                    onBlur={handleFieldBlur}
                                    autoFocus
                                    className="w-full px-2 py-1 text-sm border border-eco-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  />
                                  {/* Autocomplete Dropdown */}
                                  {showSuggestions && itemSuggestions.length > 0 && (
                                    <div
                                      className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                                      onClick={(e) => e.stopPropagation()}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      {itemSuggestions.map((suggestion, suggestionIndex) => (
                                        <div
                                          key={suggestionIndex}
                                          onClick={() => handleSelectSuggestion(index, suggestion)}
                                          className="px-3 py-2 text-sm cursor-pointer hover:bg-eco-primary-100 border-b border-gray-100 last:border-b-0"
                                        >
                                          {suggestion}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p
                                  onClick={(e) => handleFieldClick(`item-${index}-name`, e)}
                                  className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                >
                                  {item.name}
                                </p>
                              )}
                            </div>

                            {/* Item Description */}
                            <div>
                              {editingField === `item-${index}-description` ? (
                                <textarea
                                  value={item.description || ''}
                                  onChange={(e) => handleItemFieldChange(index, 'description', e.target.value)}
                                  onBlur={handleFieldBlur}
                                  autoFocus
                                  placeholder="Optional description"
                                  rows={2}
                                  className="w-full px-2 py-1 text-sm border border-eco-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <p
                                  onClick={(e) => handleFieldClick(`item-${index}-description`, e)}
                                  className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                >
                                  {item.description || '(Click to add description)'}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Item Quantity */}
                          <div className="flex-shrink-0">
                            {editingField === `item-${index}-quantity` ? (
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemFieldChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                onBlur={handleFieldBlur}
                                autoFocus
                                className="w-16 px-2 py-1 text-sm text-center border border-eco-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                onClick={(e) => handleFieldClick(`item-${index}-quantity`, e)}
                                className="inline-block text-sm font-medium text-eco-primary-600 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                              >
                                Qty: {item.quantity}
                              </span>
                            )}
                          </div>
                        </div>

                        {item.imageUrl && (
                          <div className="mt-2">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No items in this checkout</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwipeRight();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md hover:shadow-lg"
          >
            <ChevronRight size={24} />
            <span className="font-medium">Flag for Review</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSwipeLeft();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-eco-primary-500 text-white rounded-lg hover:bg-eco-primary-600 transition-colors shadow-md hover:shadow-lg"
          >
            <span className="font-medium">Confirm & Approve</span>
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Swipe Instructions */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Swipe left or click "Confirm & Approve" if all items in this checkout are correct</p>
          <p>Swipe right or click "Flag for Review" if any items need review</p>
          <p className="mt-1 text-xs">This will approve/flag all {data.totalItems || data.items?.length || 0} items in this checkout session</p>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
