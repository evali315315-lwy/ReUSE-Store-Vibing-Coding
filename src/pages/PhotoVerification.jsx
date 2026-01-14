import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Camera, ArrowLeft, RefreshCw } from 'lucide-react';
import SwipeCard from '../components/verification/SwipeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PhotoVerification = () => {
  const [view, setView] = useState('swipe'); // 'swipe' or 'table'
  const [selectedStatus, setSelectedStatus] = useState(null); // 'pending', 'approved', 'flagged'
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, flagged: 0 });

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/verification/items`, {
        params: { status: 'pending', limit: 1 }
      });
      setStats(response.data.stats || { pending: 0, approved: 0, flagged: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch checkouts for swipe view (grouped by session)
  const fetchSwipeItems = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/verification/checkouts`, {
        params: { status: 'pending', limit: 50 }
      });

      // Map database checkouts to SwipeCard expected format
      const mappedCheckouts = (response.data.checkouts || []).map(checkout => ({
        id: checkout.id,
        checkoutId: checkout.id,
        timestamp: new Date(checkout.date).toLocaleString(),
        donorName: checkout.owner_name,
        donorEmail: checkout.email,
        housingAssignment: checkout.housing_assignment,
        graduationYear: checkout.graduation_year,
        submissionId: `CHECKOUT-${checkout.id}`,
        items: checkout.items.map(item => ({
          id: item.id,
          name: item.item_name,
          quantity: item.item_quantity,
          description: item.description,
          imageUrl: item.image_url
        })),
        totalItems: checkout.items.length,
        // Keep original data for API calls
        _original: checkout
      }));

      setItems(mappedCheckouts);
      setStats(response.data.stats || { pending: 0, approved: 0, flagged: 0 });
    } catch (error) {
      console.error('Error fetching checkouts:', error);
      toast.error('Failed to load checkouts');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch items for table view (using grouped checkouts)
  const fetchTableItems = async (status) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/verification/checkouts`, {
        params: {
          status,
          limit: 100,
          lastMonthOnly: status === 'approved' // Only for approved tab
        }
      });

      // Map the checkouts to include all necessary fields
      const mappedCheckouts = (response.data.checkouts || []).map(checkout => ({
        id: checkout.id,
        checkoutId: checkout.id,
        date: checkout.date,
        owner_name: checkout.owner_name,
        email: checkout.email,
        housing_assignment: checkout.housing_assignment,
        graduation_year: checkout.graduation_year,
        items: checkout.items.map(item => ({
          id: item.id,
          name: item.item_name,
          quantity: item.item_quantity,
          description: item.description,
          imageUrl: item.image_url,
          verification_status: item.verification_status
        })),
        totalItems: checkout.items.length
      }));

      setItems(mappedCheckouts);
      setStats(response.data.stats || { pending: 0, approved: 0, flagged: 0 });
    } catch (error) {
      console.error('Error fetching checkouts:', error);
      toast.error('Failed to load checkouts');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with swipe view
  useEffect(() => {
    fetchSwipeItems();
  }, []);

  // Handle status card click
  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    setView('table');
    fetchTableItems(status);
  };

  // Back to swipe view
  const handleBackToSwipe = () => {
    setView('swipe');
    setSelectedStatus(null);
    setCurrentIndex(0);
    fetchSwipeItems();
  };

  // Handle swipe actions (updates all items in the checkout session)
  const handleSwipeLeft = async () => {
    // Swipe left = Approve all items in this checkout
    const checkout = items[currentIndex];
    try {
      await axios.patch(`${API_URL}/verification/checkouts/${checkout.checkoutId}`, {
        status: 'approved',
        verifiedAt: new Date().toISOString()
      });
      toast.success(`Checkout approved! (${checkout.totalItems} items)`);

      // Move to next checkout
      if (currentIndex < items.length - 1) {
        setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
      } else {
        toast.success('All checkouts reviewed!');
      }
      fetchStats();
    } catch (error) {
      console.error('Error approving checkout:', error);
      toast.error('Failed to approve checkout');
    }
  };

  const handleSwipeRight = async () => {
    // Swipe right = Flag all items in this checkout
    const checkout = items[currentIndex];
    try {
      await axios.patch(`${API_URL}/verification/checkouts/${checkout.checkoutId}`, {
        status: 'flagged',
        verifiedAt: new Date().toISOString()
      });
      toast.error(`Checkout flagged for review (${checkout.totalItems} items)`, { icon: '🚩' });

      // Move to next checkout
      if (currentIndex < items.length - 1) {
        setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
      } else {
        toast.success('All checkouts reviewed!');
      }
      fetchStats();
    } catch (error) {
      console.error('Error flagging checkout:', error);
      toast.error('Failed to flag checkout');
    }
  };

  const handleSkip = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Handle update status from table view (for individual items - deprecated)
  const handleUpdateStatus = async (itemId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/verification/items/${itemId}`, {
        status: newStatus,
        verifiedAt: new Date().toISOString()
      });

      toast.success(
        newStatus === 'approved' ? 'Item approved!' :
        newStatus === 'flagged' ? 'Item flagged for review' :
        'Item reconfirmed!'
      );

      // Refresh the list
      fetchTableItems(selectedStatus);
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
    }
  };

  // Handle update status for entire checkout session from table view
  const handleUpdateCheckoutStatus = async (checkoutId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/verification/checkouts/${checkoutId}`, {
        status: newStatus,
        verifiedAt: new Date().toISOString()
      });

      const checkout = items.find(c => c.checkoutId === checkoutId);
      const itemCount = checkout ? checkout.totalItems : 0;

      toast.success(
        newStatus === 'approved' ? `Checkout approved! (${itemCount} items)` :
        newStatus === 'flagged' ? `Checkout flagged for review (${itemCount} items)` :
        `Checkout reconfirmed! (${itemCount} items)`
      );

      // Refresh the list
      fetchTableItems(selectedStatus);
    } catch (error) {
      console.error('Error updating checkout status:', error);
      toast.error('Failed to update checkout status');
    }
  };

  const currentItem = items[currentIndex];

  // Swipe View
  if (view === 'swipe') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-eco-primary-50 via-white to-eco-teal-light py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Camera className="w-10 h-10 text-eco-primary-600" />
              <h1 className="text-4xl font-bold text-eco-primary-800">
                Photo Verification
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Review donation photos and confirm information accuracy
            </p>
          </div>

          {/* Statistics Bar - Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => handleStatusClick('pending')}
              className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
            >
              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-xs text-gray-400 mt-1">Click to view list</p>
            </button>
            <button
              onClick={() => handleStatusClick('approved')}
              className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-gray-600">Approved (Last Month)</p>
              <p className="text-xs text-gray-400 mt-1">Click to view list</p>
            </button>
            <button
              onClick={() => handleStatusClick('flagged')}
              className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
            >
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
              <p className="text-sm text-gray-600">Flagged (All Time)</p>
              <p className="text-xs text-gray-400 mt-1">Click to view list</p>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Progress Indicator */}
              {items.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Item {currentIndex + 1} of {items.length}
                    </span>
                    <span className="text-sm text-gray-600">
                      {Math.round(((currentIndex + 1) / items.length) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-eco-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Swipe Card */}
              {currentItem ? (
                <div className="mb-8">
                  <SwipeCard
                    data={currentItem}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                  />
                </div>
              ) : (
                <div className="card text-center py-12">
                  <CheckCircle className="w-16 h-16 text-eco-primary-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    All Done!
                  </h2>
                  <p className="text-gray-600">
                    You've reviewed all pending donations. Great job!
                  </p>
                </div>
              )}

              {/* Navigation Controls */}
              {currentItem && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="px-6 py-2 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={currentIndex >= items.length - 1}
                    className="px-6 py-2 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Table View
  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-primary-50 via-white to-eco-teal-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={handleBackToSwipe}
            className="flex items-center gap-2 text-eco-primary-600 hover:text-eco-primary-700 font-semibold mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Swipe View
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-eco-primary-800 mb-2">
              {selectedStatus === 'pending' && 'Pending Review'}
              {selectedStatus === 'approved' && 'Approved Items (Last Month)'}
              {selectedStatus === 'flagged' && 'Flagged Items'}
            </h1>
            <p className="text-gray-600 text-lg">
              {items.length} checkout session{items.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Items Found
            </h2>
            <p className="text-gray-600">
              {selectedStatus === 'pending' && 'All items have been reviewed!'}
              {selectedStatus === 'approved' && 'No approved items from the last month.'}
              {selectedStatus === 'flagged' && 'No flagged items at this time.'}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donor Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items Donated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((checkout) => (
                    <tr key={checkout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {checkout.owner_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {checkout.email}
                        </div>
                        {checkout.housing_assignment && (
                          <div className="text-xs text-gray-400 mt-1">
                            {checkout.housing_assignment}
                          </div>
                        )}
                        {checkout.graduation_year && (
                          <div className="text-xs text-gray-400">
                            Class of {checkout.graduation_year}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(checkout.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(checkout.date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-eco-primary-600 mb-2">
                          {checkout.totalItems} item{checkout.totalItems !== 1 ? 's' : ''} total
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {checkout.items.map((item, index) => (
                            <div key={item.id} className="flex items-start gap-2 text-sm">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {item.name} <span className="text-gray-500">× {item.quantity}</span>
                                </div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {selectedStatus === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleUpdateCheckoutStatus(checkout.checkoutId, 'approved')}
                              className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium transition-colors"
                            >
                              Approve All
                            </button>
                            <button
                              onClick={() => handleUpdateCheckoutStatus(checkout.checkoutId, 'flagged')}
                              className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded font-medium transition-colors"
                            >
                              Flag All
                            </button>
                          </div>
                        )}
                        {selectedStatus === 'approved' && (
                          <span className="text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Approved
                          </span>
                        )}
                        {selectedStatus === 'flagged' && (
                          <button
                            onClick={() => handleUpdateCheckoutStatus(checkout.checkoutId, 'approved')}
                            className="flex items-center gap-1 px-3 py-1 bg-eco-primary-100 text-eco-primary-700 hover:bg-eco-primary-200 rounded font-medium transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Reconfirm All
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => fetchTableItems(selectedStatus)}
            className="flex items-center gap-2 px-4 py-2 btn-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoVerification;
