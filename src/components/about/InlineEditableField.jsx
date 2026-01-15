import { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

const InlineEditableField = ({ value, onSave, isAdmin, className = '', placeholder = '', multiline = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text for easy replacement
      if (!multiline) {
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // If not admin, just show the value
  if (!isAdmin) {
    return <span className={className}>{value}</span>;
  }

  // Admin view with inline editing
  return (
    <div
      className="relative inline-block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <div className="inline-flex items-center gap-2">
          {multiline ? (
            <textarea
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${className} border-2 border-eco-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-eco-primary-500`}
              placeholder={placeholder}
              rows={2}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${className} border-2 border-eco-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-eco-primary-500`}
              placeholder={placeholder}
            />
          )}
          <button
            onClick={handleSave}
            className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className={`inline-flex items-center gap-2 ${isHovered ? 'bg-eco-primary-50 rounded px-2 py-1 cursor-pointer' : ''}`}
          onClick={() => setIsEditing(true)}
        >
          <span className={className}>{value || placeholder}</span>
          {isHovered && (
            <Edit2 className="w-3 h-3 text-eco-primary-600" />
          )}
        </div>
      )}
    </div>
  );
};

export default InlineEditableField;
