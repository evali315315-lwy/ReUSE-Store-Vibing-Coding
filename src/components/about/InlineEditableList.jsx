import { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2, Plus, Trash2 } from 'lucide-react';

const InlineEditableList = ({ items = [], onSave, isAdmin, bulletColor = 'text-eco-primary-500' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState(items);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditItems(items);
  }, [items]);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const handleSave = () => {
    // Filter out empty items
    const filteredItems = editItems.filter(item => item.trim() !== '');
    onSave(filteredItems);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setEditItems(items);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleItemChange = (index, newValue) => {
    const newItems = [...editItems];
    newItems[index] = newValue;
    setEditItems(newItems);
  };

  const handleAddItem = () => {
    setEditItems([...editItems, '']);
    setEditingIndex(editItems.length);
  };

  const handleDeleteItem = (index) => {
    const newItems = editItems.filter((_, i) => i !== index);
    setEditItems(newItems);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next item or add new one
      if (index === editItems.length - 1) {
        handleAddItem();
      } else {
        setEditingIndex(index + 1);
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // If not admin, just show the list
  if (!isAdmin) {
    return (
      <ul className="space-y-3 text-gray-700">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className={`${bulletColor} font-bold mt-1`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Admin view with inline editing
  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <div className="space-y-2">
          <ul className="space-y-2">
            {editItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className={`${bulletColor} font-bold mt-2`}>•</span>
                <div className="flex-1 flex items-center gap-2">
                  {editingIndex === index ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={item}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="flex-1 border-2 border-eco-primary-500 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                      placeholder="Enter item text..."
                    />
                  ) : (
                    <div
                      onClick={() => setEditingIndex(index)}
                      className="flex-1 px-2 py-1 cursor-pointer hover:bg-eco-primary-50 rounded"
                    >
                      <span className="text-gray-700">{item || '(empty)'}</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex-shrink-0"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleAddItem}
              className="px-3 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
              title="Save all changes"
            >
              <Check className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
              title="Cancel editing"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${isHovered ? 'bg-eco-primary-50 rounded p-2 cursor-pointer' : ''} transition-colors`}
          onClick={() => setIsEditing(true)}
        >
          <ul className="space-y-3 text-gray-700">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className={`${bulletColor} font-bold mt-1`}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {isHovered && (
            <div className="flex items-center justify-center mt-2 text-eco-primary-600 text-sm">
              <Edit2 className="w-3 h-3 mr-1" />
              <span>Click to edit list</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineEditableList;
