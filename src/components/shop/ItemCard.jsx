import { Package } from 'lucide-react';

function ItemCard({ item }) {
  const isAvailable = item.available > 0;
  const isLowStock = item.available > 0 && item.available <= 2;

  // Determine status badge color
  const getBadgeStyles = () => {
    if (!isAvailable) {
      return 'bg-red-100 text-red-700';
    }
    if (isLowStock) {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-green-100 text-green-700';
  };

  // Get availability text
  const getAvailabilityText = () => {
    if (!isAvailable) return 'Out of Stock';
    return 'Available';
  };

  return (
    <div className="card hover:shadow-xl transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-eco-primary-50 rounded-lg">
          <Package className="w-6 h-6 text-eco-primary-600" />
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeStyles()}`}
        >
          {getAvailabilityText()}
        </span>
      </div>

      <h3 className="text-xl font-bold text-eco-primary-800 mb-2">
        {item.name}
      </h3>

      {/* Category badges */}
      {item.categories && item.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {item.categories.map((category, index) => (
            <span
              key={index}
              className="text-xs bg-eco-sky-100 text-eco-sky-700 px-2 py-1 rounded"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {/* Quantity display */}
      <p className="text-sm text-gray-600 font-medium">
        Quantity: {item.quantity || 0}
      </p>
    </div>
  );
}

export default ItemCard;
