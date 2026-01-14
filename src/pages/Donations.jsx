import { useState } from 'react';
import CheckOutTab from '../components/checkoutsystem/CheckOutTab';
import CheckInTab from '../components/checkoutsystem/CheckInTab';
import FridgeReturnTab from '../components/checkoutsystem/FridgeReturnTab';
import FridgeCheckInTab from '../components/checkoutsystem/FridgeCheckInTab';

function Donations() {
  const [activeTab, setActiveTab] = useState('checkout');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('checkout')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'checkout'
                ? 'border-eco-primary-600 text-eco-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Check-Out
          </button>
          <button
            onClick={() => setActiveTab('checkin')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'checkin'
                ? 'border-eco-primary-600 text-eco-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Check-In
          </button>
          <button
            onClick={() => setActiveTab('fridgereturn')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'fridgereturn'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Fridge Return
          </button>
          <button
            onClick={() => setActiveTab('fridgecheckin')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'fridgecheckin'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Fridge Check-In
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto">
        {activeTab === 'checkout' && <CheckOutTab />}
        {activeTab === 'checkin' && <CheckInTab />}
        {activeTab === 'fridgereturn' && <FridgeReturnTab />}
        {activeTab === 'fridgecheckin' && <FridgeCheckInTab />}
      </div>
    </div>
  );
}

export default Donations;
