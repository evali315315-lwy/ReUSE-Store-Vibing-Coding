import { ShoppingBag } from 'lucide-react';

function ShopHeader() {
  return (
    <div className="text-center mb-8">
      <div className="inline-block p-4 bg-eco-primary-100 rounded-full mb-4">
        <ShoppingBag className="w-12 h-12 text-eco-primary-600" />
      </div>
      <h1 className="text-4xl font-bold text-eco-primary-800 mb-3 font-display">
        Shop Inventory
      </h1>
      <p className="text-gray-600 text-lg">
        Browse available items or search for what you need
      </p>
    </div>
  );
}

export default ShopHeader;
