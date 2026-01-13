import { Search, Package } from 'lucide-react';

function EmptyState({ type = 'no-search', searchQuery, hasFilters }) {
  const renderContent = () => {
    // No search or filters applied
    if (type === 'no-search') {
      return (
        <>
          <div className="inline-block p-4 bg-eco-primary-100 rounded-full mb-4">
            <Search className="w-12 h-12 text-eco-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">
            Find What You Need
          </h3>
          <p className="text-gray-600">
            Use the search bar or category filters to browse available items
          </p>
        </>
      );
    }

    // Search/filter applied but no results
    if (type === 'no-results') {
      return (
        <>
          <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
            <Package className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">
            No Items Found
          </h3>
          <p className="text-gray-600 mb-2">
            {searchQuery
              ? `No results found for "${searchQuery}"`
              : 'No items match your filters'}
          </p>
          <p className="text-gray-500 text-sm">
            Try adjusting your search or filters, or check back later for new donations
          </p>
        </>
      );
    }

    // Items unavailable
    if (type === 'unavailable') {
      return (
        <>
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
            <Package className="w-12 h-12 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">
            No Available Items
          </h3>
          <p className="text-gray-600">
            These items are currently out of stock. Check back soon or try browsing other categories!
          </p>
        </>
      );
    }

    return null;
  };

  return (
    <div className="text-center py-16">
      {renderContent()}
    </div>
  );
}

export default EmptyState;
