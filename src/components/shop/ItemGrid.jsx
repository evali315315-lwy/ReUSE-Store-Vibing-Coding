import ItemCard from './ItemCard';
import EmptyState from './EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';

function ItemGrid({ items, isLoading, searchQuery, hasFilters }) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" text="Loading inventory..." />
      </div>
    );
  }

  // No items found
  if (!items || items.length === 0) {
    const emptyStateType = searchQuery || hasFilters ? 'no-results' : 'no-search';
    return <EmptyState type={emptyStateType} searchQuery={searchQuery} hasFilters={hasFilters} />;
  }

  // Display item count
  const availableCount = items.filter(item => item.available > 0).length;

  return (
    <div>
      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing <span className="font-semibold text-eco-primary-700">{items.length}</span> item
        {items.length !== 1 ? 's' : ''}
        {availableCount !== items.length && (
          <span>
            {' '}(<span className="font-semibold">{availableCount}</span> available)
          </span>
        )}
      </div>

      {/* Item grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default ItemGrid;
