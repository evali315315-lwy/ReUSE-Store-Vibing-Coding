import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, Flag } from 'lucide-react';

const SwipeCard = ({ data, onSwipeLeft, onSwipeRight }) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

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
                <p className="text-gray-900 mt-1">{data.donorName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Donor Email</label>
                <p className="text-gray-900 mt-1">{data.donorEmail}</p>
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
                  {data.items && data.items.length > 0 ? (
                    data.items.map((item, index) => (
                      <div key={item.id || index} className="bg-white p-3 rounded-md border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          <span className="text-sm font-medium text-eco-primary-600 ml-2">
                            Qty: {item.quantity}
                          </span>
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
