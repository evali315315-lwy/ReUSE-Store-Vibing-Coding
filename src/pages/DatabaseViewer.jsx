import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Database, ChevronUp, ChevronDown, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function DatabaseViewer() {
  const [checkouts, setCheckouts] = useState([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedYear, setSelectedYear] = useState('all');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

  // Fetch all checkouts with items
  useEffect(() => {
    fetchCheckouts();
  }, []);

  const fetchCheckouts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/checkouts`, {
        params: { limit: 1000 }
      });

      const checkoutsWithItems = response.data.checkouts || [];
      setCheckouts(checkoutsWithItems);
      setFilteredCheckouts(checkoutsWithItems);

      // Extract unique years
      const years = [...new Set(checkoutsWithItems.map(c => c.year_range))].sort().reverse();
      setAvailableYears(years);
    } catch (error) {
      console.error('Error fetching checkouts:', error);
      toast.error('Failed to load database');
      setCheckouts([]);
      setFilteredCheckouts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search and year filter
  useEffect(() => {
    let filtered = [...checkouts];

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(checkout => checkout.year_range === selectedYear);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(checkout => {
        const checkoutMatch =
          checkout.owner_name?.toLowerCase().includes(query) ||
          checkout.email?.toLowerCase().includes(query) ||
          checkout.housing_assignment?.toLowerCase().includes(query) ||
          checkout.graduation_year?.toString().includes(query) ||
          checkout.date?.toLowerCase().includes(query) ||
          checkout.year_range?.toLowerCase().includes(query);

        const itemsMatch = checkout.items?.some(item =>
          item.item_name?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
        );

        return checkoutMatch || itemsMatch;
      });
    }

    setFilteredCheckouts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedYear, checkouts]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCheckouts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCheckouts = filteredCheckouts.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredCheckouts].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (key === 'total_items') {
        aValue = a.items?.length || 0;
        bValue = b.items?.length || 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCheckouts(sorted);
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-eco-primary-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-eco-primary-600" />
    );
  };

  // Helper function to categorize items
  const categorizeItems = (items) => {
    const generalItems = items?.filter(item =>
      !item.item_name?.toLowerCase().includes('fridge')
    ) || [];
    const fridgeItems = items?.filter(item =>
      item.item_name?.toLowerCase().includes('fridge') ||
      item.item_name?.toLowerCase().includes('refrigerator')
    ) || [];

    return {
      generalCount: generalItems.length,
      fridgeCount: fridgeItems.length,
      generalItems: generalItems,
      fridgeItems: fridgeItems
    };
  };

  const getItemCounts = (checkout) => {
    const generalItems = checkout.items?.filter(item =>
      !item.item_name?.toLowerCase().includes('fridge') &&
      !item.item_name?.toLowerCase().includes('refrigerator')
    ) || [];

    const fridgeItems = checkout.items?.filter(item =>
      item.item_name?.toLowerCase().includes('fridge') ||
      item.item_name?.toLowerCase().includes('refrigerator')
    ) || [];

    return {
      generalCount: generalItems.length,
      fridgeCount: fridgeItems.length
    };
  };

  // Get verification status of checkout
  const getVerificationStatus = (checkout) => {
    if (!checkout.items || checkout.items.length === 0) return 'pending';

    const statuses = checkout.items.map(item => item.verification_status);

    // If any item is flagged, the whole checkout is flagged
    if (statuses.includes('flagged')) return 'flagged';

    // If all items are approved, checkout is approved
    if (statuses.every(status => status === 'approved')) return 'approved';

    // Otherwise it's pending
    return 'pending';
  };

  // Handle row click to view details
  const handleRowClick = (checkout) => {
    setSelectedCheckout(checkout);
  };

  const closeModal = () => {
    setSelectedCheckout(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-primary-50 via-white to-eco-teal-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className="w-10 h-10 text-eco-primary-600" />
            <h1 className="text-4xl font-bold text-eco-primary-800">
              Database Viewer
            </h1>
            <button
              onClick={fetchCheckouts}
              disabled={isLoading}
              className="ml-4 p-2 rounded-lg bg-eco-primary-600 text-white hover:bg-eco-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-gray-600 text-lg">
            View and search all checkout records
          </p>
        </div>

        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, housing, items, or any field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary-500 focus:border-transparent"
            />
          </div>

          {/* Year Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedYear === 'all'
                  ? 'bg-eco-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Years
            </button>
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedYear === year
                    ? 'bg-eco-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-500">
            Showing {filteredCheckouts.length} of {checkouts.length} records
            {selectedYear !== 'all' && ` (${selectedYear})`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredCheckouts.length === 0 ? (
          <div className="card text-center py-12">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Records Found
            </h2>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search query' : 'No data available in the database'}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Pagination Controls - Top */}
            {filteredCheckouts.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredCheckouts.length)}</span> of{' '}
                    <span className="font-medium">{filteredCheckouts.length}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      First
                    </button>
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-1 border rounded text-sm ${
                              currentPage === pageNum
                                ? 'bg-eco-primary-600 text-white border-eco-primary-600'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('id')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        ID
                        <SortIcon columnKey="id" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <SortIcon columnKey="date" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('owner_name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Donor Name
                        <SortIcon columnKey="owner_name" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('email')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Email
                        <SortIcon columnKey="email" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('housing_assignment')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Housing
                        <SortIcon columnKey="housing_assignment" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('graduation_year')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Grad Year
                        <SortIcon columnKey="graduation_year" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('year_range')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Year Range
                        <SortIcon columnKey="year_range" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      General Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fridge Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCheckouts.map((checkout) => {
                    const { generalCount, fridgeCount } = getItemCounts(checkout);
                    const status = getVerificationStatus(checkout);
                    return (
                      <tr
                        key={checkout.id}
                        onClick={() => handleRowClick(checkout)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {checkout.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(checkout.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {checkout.owner_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {checkout.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {checkout.housing_assignment || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {checkout.graduation_year || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {checkout.year_range}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-eco-primary-600">
                          {generalCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-eco-teal-600">
                          {fridgeCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {status === 'approved' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={18} />
                              <span className="font-medium">Approved</span>
                            </div>
                          )}
                          {status === 'pending' && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Clock size={18} />
                              <span className="font-medium">Pending</span>
                            </div>
                          )}
                          {status === 'flagged' && (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle size={18} />
                              <span className="font-medium">Flagged</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredCheckouts.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredCheckouts.length)}</span> of{' '}
                    <span className="font-medium">{filteredCheckouts.length}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      First
                    </button>
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-1 border rounded text-sm ${
                              currentPage === pageNum
                                ? 'bg-eco-primary-600 text-white border-eco-primary-600'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {selectedCheckout && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-eco-primary-600 text-white px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Checkout Details</h2>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-gray-200 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Checkout Information */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-eco-primary-800 mb-3">Donor Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-gray-600">Checkout ID:</label>
                        <p className="font-medium">{selectedCheckout.id}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Name:</label>
                        <p className="font-medium">{selectedCheckout.owner_name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email:</label>
                        <p className="font-medium">{selectedCheckout.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Housing:</label>
                        <p className="font-medium">{selectedCheckout.housing_assignment || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Graduation Year:</label>
                        <p className="font-medium">{selectedCheckout.graduation_year || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-eco-primary-800 mb-3">Checkout Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-gray-600">Date:</label>
                        <p className="font-medium">{new Date(selectedCheckout.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Year Range:</label>
                        <p className="font-medium">{selectedCheckout.year_range}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Total Items:</label>
                        <p className="font-medium">{selectedCheckout.items?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-eco-primary-800 mb-3">Items Checked Out</h3>

                  {/* General Items */}
                  {(() => {
                    const { generalItems, fridgeItems } = categorizeItems(selectedCheckout.items);
                    return (
                      <>
                        {generalItems.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-eco-primary-600 mb-2">General Items ({generalItems.length})</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="space-y-2">
                                {generalItems.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <div>
                                      <p className="font-medium">{item.item_name}</p>
                                      {item.description && (
                                        <p className="text-sm text-gray-600">{item.description}</p>
                                      )}
                                    </div>
                                    <span className="text-sm font-semibold text-eco-primary-600">
                                      Qty: {item.item_quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Fridge Items */}
                        {fridgeItems.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-eco-teal-600 mb-2">Fridge Items ({fridgeItems.length})</h4>
                            <div className="bg-eco-teal-50 rounded-lg p-4">
                              <div className="space-y-2">
                                {fridgeItems.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center border-b border-eco-teal-200 pb-2">
                                    <div>
                                      <p className="font-medium">{item.item_name}</p>
                                      {item.fridge_company && (
                                        <p className="text-sm font-semibold text-eco-teal-700">
                                          Company: {item.fridge_company}
                                        </p>
                                      )}
                                      {item.fridge_model && (
                                        <p className="text-sm text-gray-600">Model: {item.fridge_model}</p>
                                      )}
                                      {item.fridge_size && (
                                        <p className="text-sm text-gray-600">Size: {item.fridge_size}</p>
                                      )}
                                      {item.fridge_condition && (
                                        <p className="text-sm text-gray-600">Condition: {item.fridge_condition}</p>
                                      )}
                                      {item.description && (
                                        <p className="text-sm text-gray-600">{item.description}</p>
                                      )}
                                    </div>
                                    <span className="text-sm font-semibold text-eco-teal-600">
                                      Qty: {item.item_quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {generalItems.length === 0 && fridgeItems.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No items found</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DatabaseViewer;
