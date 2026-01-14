import { useState, useEffect } from 'react';
import { Package, Calendar, AlertCircle, CheckCircle, Wrench, UserCheck, UserX } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FridgeCheckoutForm from '../components/fridges/FridgeCheckoutForm';
import FridgeCheckinForm from '../components/fridges/FridgeCheckinForm';
import FridgeList from '../components/fridges/FridgeList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FridgeInventory = () => {
  const [view, setView] = useState('overview'); // 'overview', 'checkout', 'checkin', 'inventory'
  const [stats, setStats] = useState({ total: 0, available: 0, checkedOut: 0, maintenance: 0, overdue: 0 });
  const [fridges, setFridges] = useState([]);
  const [activeCheckouts, setActiveCheckouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCheckout, setSelectedCheckout] = useState(null);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/fridges/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  // Fetch fridges
  const fetchFridges = async () => {
    try {
      const response = await axios.get(`${API_URL}/fridges`);
      setFridges(response.data.fridges);
    } catch (error) {
      console.error('Error fetching fridges:', error);
      toast.error('Failed to load fridges');
    }
  };

  // Fetch active checkouts
  const fetchActiveCheckouts = async () => {
    try {
      const response = await axios.get(`${API_URL}/fridges/checkouts/active`);
      setActiveCheckouts(response.data.checkouts);
    } catch (error) {
      console.error('Error fetching checkouts:', error);
      toast.error('Failed to load checkouts');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchFridges(), fetchActiveCheckouts()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleCheckoutSuccess = () => {
    fetchStats();
    fetchFridges();
    fetchActiveCheckouts();
    setView('overview');
    toast.success('Fridge checked out successfully!');
  };

  const handleCheckinSuccess = () => {
    fetchStats();
    fetchFridges();
    fetchActiveCheckouts();
    setView('overview');
    setSelectedCheckout(null);
    toast.success('Fridge returned successfully!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-eco-primary-50 via-white to-eco-teal-light flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-primary-50 via-white to-eco-teal-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="w-10 h-10 text-eco-primary-600" />
            <h1 className="text-4xl font-bold text-eco-primary-800">
              Fridge Inventory Management
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Track fridge check-outs and returns for the academic year
          </p>
        </div>

        {/* Overview View */}
        {view === 'overview' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="card text-center">
                <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Fridges</p>
              </div>
              <div className="card text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
              <div className="card text-center">
                <UserCheck className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{stats.checkedOut}</p>
                <p className="text-sm text-gray-600">Checked Out</p>
              </div>
              <div className="card text-center">
                <Wrench className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{stats.maintenance}</p>
                <p className="text-sm text-gray-600">Maintenance</p>
              </div>
              <div className="card text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => setView('checkout')}
                className="btn-primary py-6 text-lg flex items-center justify-center gap-2"
              >
                <UserCheck className="w-6 h-6" />
                Check Out Fridge
              </button>
              <button
                onClick={() => setView('checkin')}
                className="btn-secondary py-6 text-lg flex items-center justify-center gap-2"
              >
                <UserX className="w-6 h-6" />
                Check In Fridge
              </button>
              <button
                onClick={() => setView('inventory')}
                className="btn-secondary py-6 text-lg flex items-center justify-center gap-2"
              >
                <Package className="w-6 h-6" />
                View All Fridges
              </button>
            </div>

            {/* Active Checkouts */}
            <div className="card">
              <h2 className="text-2xl font-bold text-eco-primary-800 mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Active Checkouts ({activeCheckouts.length})
              </h2>

              {activeCheckouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active checkouts. All fridges are available or in maintenance.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fridge</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Housing</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activeCheckouts.map((checkout) => {
                        const isOverdue = new Date(checkout.expected_return_date) < new Date();
                        return (
                          <tr key={checkout.id} className={isOverdue ? 'bg-red-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{checkout.fridge_number}</div>
                              <div className="text-sm text-gray-500">
                                {checkout.brand} {checkout.model}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{checkout.student_name}</div>
                              <div className="text-sm text-gray-500">{checkout.student_email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {checkout.housing_assignment}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(checkout.checkout_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                                {new Date(checkout.expected_return_date).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isOverdue ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => {
                                  setSelectedCheckout(checkout);
                                  setView('checkin');
                                }}
                                className="text-eco-primary-600 hover:text-eco-primary-700 font-medium"
                              >
                                Return
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Check Out View */}
        {view === 'checkout' && (
          <FridgeCheckoutForm
            fridges={fridges.filter(f => f.status === 'available')}
            onSuccess={handleCheckoutSuccess}
            onCancel={() => setView('overview')}
          />
        )}

        {/* Check In View */}
        {view === 'checkin' && (
          <FridgeCheckinForm
            checkout={selectedCheckout}
            activeCheckouts={activeCheckouts}
            onSuccess={handleCheckinSuccess}
            onCancel={() => {
              setView('overview');
              setSelectedCheckout(null);
            }}
          />
        )}

        {/* Inventory View */}
        {view === 'inventory' && (
          <FridgeList
            fridges={fridges}
            onBack={() => setView('overview')}
            onUpdate={() => {
              fetchStats();
              fetchFridges();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FridgeInventory;
