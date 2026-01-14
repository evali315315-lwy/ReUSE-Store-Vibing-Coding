import { ArrowLeft, Edit2 } from 'lucide-react';

const FridgeList = ({ fridges, onBack, onUpdate }) => {
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    checked_out: 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-purple-100 text-purple-800',
    retired: 'bg-gray-100 text-gray-800'
  };

  const conditionColors = {
    Good: 'text-green-600',
    Fair: 'text-yellow-600',
    'Needs Repair': 'text-red-600'
  };

  return (
    <div className="card">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-eco-primary-600 hover:text-eco-primary-700 mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Overview
      </button>

      <h2 className="text-2xl font-bold text-eco-primary-800 mb-6">
        All Fridges ({fridges.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fridge #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Brand/Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date Acquired
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fridges.map(fridge => (
              <tr key={fridge.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{fridge.fridge_number}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {fridge.brand || 'N/A'} {fridge.model || ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {fridge.size || 'Standard'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${conditionColors[fridge.condition] || 'text-gray-600'}`}>
                    {fridge.condition}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[fridge.status] || 'bg-gray-100 text-gray-800'}`}>
                    {fridge.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fridge.date_acquired ? new Date(fridge.date_acquired).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    className="text-eco-primary-600 hover:text-eco-primary-700 flex items-center gap-1"
                    title="Edit fridge"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fridges.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No fridges in inventory. Add fridges to get started.
        </div>
      )}
    </div>
  );
};

export default FridgeList;
