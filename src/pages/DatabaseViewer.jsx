import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Database, ChevronUp, ChevronDown, RefreshCw, CheckCircle, Clock, XCircle, Package, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function DatabaseViewer() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'inventory'

  // User Database States
  const [checkouts, setCheckouts] = useState([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedYear, setSelectedYear] = useState('all');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [editingField, setEditingField] = useState(null); // { type: 'checkout|item', id, field }
  const [editValue, setEditValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Inventory Database States
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventorySortConfig, setInventorySortConfig] = useState({ key: 'item_name', direction: 'asc' });
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPerPage] = useState(50);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchCheckouts();
    } else {
      fetchInventory();
    }
  }, [activeTab]);

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

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/inventory`);
      const items = response.data || [];

      // Fetch variants for each item and expand into separate rows
      const expandedItems = [];

      for (const item of items) {
        try {
          const variantsResponse = await axios.get(`${API_URL}/inventory/${item.id}/variants`);
          const variants = variantsResponse.data || [];

          if (variants.length > 0) {
            // If item has variants, show each variant as a separate row
            variants.forEach(variant => {
              expandedItems.push({
                id: `${item.id}-v${variant.id}`,
                item_name: `${item.item_name} - ${variant.variant_description}`,
                quantity: variant.quantity,
                category: item.category,
                description: variant.variant_description,
                last_updated: variant.last_updated,
                isVariant: true,
                parentId: item.id,
                variantId: variant.id
              });
            });
          } else {
            // No variants, show the main item
            expandedItems.push(item);
          }
        } catch (error) {
          // If error fetching variants, just show the main item
          expandedItems.push(item);
        }
      }

      setInventoryItems(expandedItems);
      setFilteredInventory(expandedItems);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
      setInventoryItems([]);
      setFilteredInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search and year filter for checkouts
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

  // Handle search filter and sorting for inventory
  useEffect(() => {
    let filtered = [...inventoryItems];

    if (inventorySearchQuery.trim()) {
      const query = inventorySearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.item_name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[inventorySortConfig.key];
      let bValue = b[inventorySortConfig.key];

      // Handle different data types
      if (inventorySortConfig.key === 'quantity') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (inventorySortConfig.key === 'last_updated') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        // String comparison (case-insensitive)
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }

      if (aValue < bValue) {
        return inventorySortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return inventorySortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredInventory(filtered);
  }, [inventorySearchQuery, inventoryItems, inventorySortConfig]);

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

  // Handle sorting for inventory
  const handleInventorySort = (key) => {
    let direction = 'asc';
    if (inventorySortConfig.key === key && inventorySortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setInventorySortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey, isInventory = false }) => {
    const currentSortConfig = isInventory ? inventorySortConfig : sortConfig;
    if (currentSortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return currentSortConfig.direction === 'asc' ? (
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
    setEditingField(null);
    setEditValue('');
  };

  // Start editing a field
  const startEditing = (type, id, field, currentValue) => {
    setEditingField({ type, id, field });
    setEditValue(currentValue || '');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Get suggestions based on field type and current value
  const getSuggestions = (field, value) => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lowerValue = value.toLowerCase();
    let uniqueValues = new Set();

    // Get unique values from all checkouts based on field
    checkouts.forEach(checkout => {
      if (field === 'owner_name' && checkout.owner_name) {
        if (checkout.owner_name.toLowerCase().includes(lowerValue)) {
          uniqueValues.add(checkout.owner_name);
        }
      } else if (field === 'email' && checkout.email) {
        if (checkout.email.toLowerCase().includes(lowerValue)) {
          uniqueValues.add(checkout.email);
        }
      } else if (field === 'housing_assignment' && checkout.housing_assignment) {
        if (checkout.housing_assignment.toLowerCase().includes(lowerValue)) {
          uniqueValues.add(checkout.housing_assignment);
        }
      } else if (field === 'graduation_year' && checkout.graduation_year) {
        if (checkout.graduation_year.toString().includes(value)) {
          uniqueValues.add(checkout.graduation_year.toString());
        }
      } else if (field === 'year_range' && checkout.year_range) {
        if (checkout.year_range.toLowerCase().includes(lowerValue)) {
          uniqueValues.add(checkout.year_range);
        }
      } else if (field === 'item_name') {
        // Search through all items
        checkout.items?.forEach(item => {
          if (item.item_name && item.item_name.toLowerCase().includes(lowerValue)) {
            uniqueValues.add(item.item_name);
          }
        });
      } else if (field === 'description') {
        // Search through all item descriptions
        checkout.items?.forEach(item => {
          if (item.description && item.description.toLowerCase().includes(lowerValue)) {
            uniqueValues.add(item.description);
          }
        });
      }
    });

    const suggestionsList = Array.from(uniqueValues).slice(0, 10); // Limit to 10 suggestions
    setSuggestions(suggestionsList);
    setShowSuggestions(suggestionsList.length > 0);
  };

  // Handle input change with suggestions
  const handleEditValueChange = (value) => {
    setEditValue(value);
    if (editingField && editingField.field !== 'date') {
      getSuggestions(editingField.field, value);
    }
  };

  // Select a suggestion
  const selectSuggestion = (suggestion) => {
    setEditValue(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Save checkout field
  const saveCheckoutField = async (checkoutId, field, value) => {
    try {
      await axios.patch(`${API_URL}/checkouts/${checkoutId}`, {
        [field]: value
      });

      // Update local state
      setSelectedCheckout(prev => ({
        ...prev,
        [field]: value
      }));

      // Update in the list
      setCheckouts(prev => prev.map(c =>
        c.id === checkoutId ? { ...c, [field]: value } : c
      ));
      setFilteredCheckouts(prev => prev.map(c =>
        c.id === checkoutId ? { ...c, [field]: value } : c
      ));

      toast.success('Field updated successfully');
      cancelEditing();
    } catch (error) {
      console.error('Error updating checkout:', error);
      toast.error('Failed to update field');
    }
  };

  // Save item field
  const saveItemField = async (itemId, field, value) => {
    try {
      await axios.patch(`${API_URL}/items/${itemId}`, {
        [field]: value
      });

      // Update local state
      setSelectedCheckout(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      }));

      // Update in the list
      setCheckouts(prev => prev.map(c => ({
        ...c,
        items: c.items?.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      })));
      setFilteredCheckouts(prev => prev.map(c => ({
        ...c,
        items: c.items?.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      })));

      toast.success('Item updated successfully');
      cancelEditing();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  // Handle save based on type
  const handleSave = () => {
    if (!editingField) return;

    const { type, id, field } = editingField;
    if (type === 'checkout') {
      saveCheckoutField(id, field, editValue);
    } else if (type === 'item') {
      saveItemField(id, field, editValue);
    }
  };

  // Handle key press (Enter to save, Escape to cancel)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
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
              onClick={activeTab === 'users' ? fetchCheckouts : fetchInventory}
              disabled={isLoading}
              className="ml-4 p-2 rounded-lg bg-eco-primary-600 text-white hover:bg-eco-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-gray-600 text-lg">
            {activeTab === 'users' ? 'View and search all checkout records' : 'View and manage inventory stock'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-eco-primary-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            User Database
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'inventory'
                ? 'bg-eco-primary-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            Inventory Database
          </button>
        </div>

        {/* User Database View */}
        {activeTab === 'users' && (
          <>
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
                          {/* Editable Name */}
                          <div>
                            <label className="text-sm text-gray-600">Name:</label>
                            {editingField?.type === 'checkout' && editingField?.id === selectedCheckout.id && editingField?.field === 'owner_name' ? (
                              <div className="relative">
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => handleEditValueChange(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    className="flex-1 px-2 py-1 border border-eco-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleSave}
                                    className="px-3 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {/* Suggestions Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {suggestions.map((suggestion, index) => (
                                      <div
                                        key={index}
                                        className="px-3 py-2 hover:bg-eco-primary-50 cursor-pointer text-sm"
                                        onClick={() => selectSuggestion(suggestion)}
                                      >
                                        {suggestion}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p
                                className="font-medium cursor-pointer hover:bg-eco-primary-50 px-2 py-1 rounded transition-colors"
                                onClick={() => startEditing('checkout', selectedCheckout.id, 'owner_name', selectedCheckout.owner_name)}
                              >
                                {selectedCheckout.owner_name}
                              </p>
                            )}
                          </div>
                          {/* Editable Email */}
                          <div>
                            <label className="text-sm text-gray-600">Email:</label>
                            {editingField?.type === 'checkout' && editingField?.id === selectedCheckout.id && editingField?.field === 'email' ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="email"
                                  value={editValue}
                                  onChange={(e) => handleEditValueChange(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  className="flex-1 px-2 py-1 border border-eco-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleSave}
                                  className="px-3 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <p
                                className="font-medium cursor-pointer hover:bg-eco-primary-50 px-2 py-1 rounded transition-colors"
                                onClick={() => startEditing('checkout', selectedCheckout.id, 'email', selectedCheckout.email)}
                              >
                                {selectedCheckout.email}
                              </p>
                            )}
                          </div>
                          {/* Editable Housing */}
                          <div>
                            <label className="text-sm text-gray-600">Housing:</label>
                            {editingField?.type === 'checkout' && editingField?.id === selectedCheckout.id && editingField?.field === 'housing_assignment' ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => handleEditValueChange(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  className="flex-1 px-2 py-1 border border-eco-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleSave}
                                  className="px-3 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <p
                                className="font-medium cursor-pointer hover:bg-eco-primary-50 px-2 py-1 rounded transition-colors"
                                onClick={() => startEditing('checkout', selectedCheckout.id, 'housing_assignment', selectedCheckout.housing_assignment)}
                              >
                                {selectedCheckout.housing_assignment || 'N/A'}
                              </p>
                            )}
                          </div>
                          {/* Editable Graduation Year */}
                          <div>
                            <label className="text-sm text-gray-600">Graduation Year:</label>
                            {editingField?.type === 'checkout' && editingField?.id === selectedCheckout.id && editingField?.field === 'graduation_year' ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => handleEditValueChange(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  className="flex-1 px-2 py-1 border border-eco-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleSave}
                                  className="px-3 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <p
                                className="font-medium cursor-pointer hover:bg-eco-primary-50 px-2 py-1 rounded transition-colors"
                                onClick={() => startEditing('checkout', selectedCheckout.id, 'graduation_year', selectedCheckout.graduation_year)}
                              >
                                {selectedCheckout.graduation_year || 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-eco-primary-800 mb-3">Checkout Information</h3>
                        <div className="space-y-2">
                          {/* Editable Date */}
                          <div>
                            <label className="text-sm text-gray-600">Date:</label>
                            {editingField?.type === 'checkout' && editingField?.id === selectedCheckout.id && editingField?.field === 'date' ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => handleEditValueChange(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  className="flex-1 px-2 py-1 border border-eco-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleSave}
                                  className="px-3 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <p
                                className="font-medium cursor-pointer hover:bg-eco-primary-50 px-2 py-1 rounded transition-colors"
                                onClick={() => {
                                  // Convert date to YYYY-MM-DD format for input
                                  const dateObj = new Date(selectedCheckout.date);
                                  const formattedDate = dateObj.toISOString().split('T')[0];
                                  startEditing('checkout', selectedCheckout.id, 'date', formattedDate);
                                }}
                              >
                                {new Date(selectedCheckout.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {/* Editable Year Range */}
                          <div>
                            <label className="text-sm text-gray-600">Year Range:</label>
                            {editingField?.type === 'checkout' && editingField?.id === selectedCheckout.id && editingField?.field === 'year_range' ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => handleEditValueChange(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  placeholder="e.g., 2024-2025"
                                  className="flex-1 px-2 py-1 border border-eco-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleSave}
                                  className="px-3 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <p
                                className="font-medium cursor-pointer hover:bg-eco-primary-50 px-2 py-1 rounded transition-colors"
                                onClick={() => startEditing('checkout', selectedCheckout.id, 'year_range', selectedCheckout.year_range)}
                              >
                                {selectedCheckout.year_range}
                              </p>
                            )}
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
                                      <div key={item.id} className="border-b border-gray-200 pb-2">
                                        <div className="flex justify-between items-start gap-2">
                                          <div className="flex-1">
                                            {/* Editable Item Name */}
                                            {editingField?.type === 'item' && editingField?.id === item.id && editingField?.field === 'item_name' ? (
                                              <div className="flex gap-2 items-center mb-2">
                                                <input
                                                  type="text"
                                                  value={editValue}
                                                  onChange={(e) => handleEditValueChange(e.target.value)}
                                                  onKeyDown={handleKeyPress}
                                                  className="flex-1 px-2 py-1 border border-eco-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
                                                  autoFocus
                                                />
                                                <button
                                                  onClick={handleSave}
                                                  className="px-2 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 text-xs"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  onClick={cancelEditing}
                                                  className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            ) : (
                                              <p
                                                className="font-medium cursor-pointer hover:bg-eco-primary-50 px-2 py-1 rounded transition-colors inline-block"
                                                onClick={() => startEditing('item', item.id, 'item_name', item.item_name)}
                                              >
                                                {item.item_name}
                                              </p>
                                            )}
                                            {/* Editable Description */}
                                            {editingField?.type === 'item' && editingField?.id === item.id && editingField?.field === 'description' ? (
                                              <div className="flex gap-2 items-center">
                                                <input
                                                  type="text"
                                                  value={editValue}
                                                  onChange={(e) => handleEditValueChange(e.target.value)}
                                                  onKeyDown={handleKeyPress}
                                                  className="flex-1 px-2 py-1 border border-eco-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500 text-sm"
                                                  autoFocus
                                                />
                                                <button
                                                  onClick={handleSave}
                                                  className="px-2 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 text-xs"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  onClick={cancelEditing}
                                                  className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            ) : (
                                              <p
                                                className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors inline-block"
                                                onClick={() => startEditing('item', item.id, 'description', item.description)}
                                              >
                                                {item.description || 'Click to add description'}
                                              </p>
                                            )}
                                          </div>
                                          {/* Editable Quantity */}
                                          <div>
                                            {editingField?.type === 'item' && editingField?.id === item.id && editingField?.field === 'item_quantity' ? (
                                              <div className="flex gap-1 items-center">
                                                <input
                                                  type="number"
                                                  value={editValue}
                                                  onChange={(e) => handleEditValueChange(e.target.value)}
                                                  onKeyDown={handleKeyPress}
                                                  className="w-16 px-2 py-1 border border-eco-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-eco-primary-500 text-sm"
                                                  autoFocus
                                                />
                                                <button
                                                  onClick={handleSave}
                                                  className="px-2 py-1 bg-eco-primary-600 text-white rounded hover:bg-eco-primary-700 text-xs"
                                                >
                                                  ✓
                                                </button>
                                                <button
                                                  onClick={cancelEditing}
                                                  className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ) : (
                                              <span
                                                className="text-sm font-semibold text-eco-primary-600 cursor-pointer hover:bg-eco-primary-50 px-2 py-1 rounded transition-colors inline-block"
                                                onClick={() => startEditing('item', item.id, 'item_quantity', item.item_quantity)}
                                              >
                                                Qty: {item.item_quantity}
                                              </span>
                                            )}
                                          </div>
                                        </div>
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
          </>
        )}

        {/* Inventory Database View */}
        {activeTab === 'inventory' && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card text-center bg-gradient-to-br from-eco-primary-50 to-white">
                <Package className="w-10 h-10 text-eco-primary-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-eco-primary-800">{inventoryItems.length}</p>
                <p className="text-sm text-gray-600">Total Items</p>
              </div>
              <div className="card text-center bg-gradient-to-br from-green-50 to-white">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-700">
                  {inventoryItems.filter(item => item.quantity > 0).length}
                </p>
                <p className="text-sm text-gray-600">In Stock</p>
              </div>
              <div className="card text-center bg-gradient-to-br from-yellow-50 to-white">
                <Clock className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-yellow-700">
                  {inventoryItems.filter(item => item.quantity > 0 && item.quantity < 5).length}
                </p>
                <p className="text-sm text-gray-600">Low Stock</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search inventory by item name, category..."
                  value={inventorySearchQuery}
                  onChange={(e) => {
                    setInventorySearchQuery(e.target.value);
                    setInventoryPage(1); // Reset to first page on search
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-eco-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Showing {Math.min((inventoryPage - 1) * inventoryPerPage + 1, filteredInventory.length)}-{Math.min(inventoryPage * inventoryPerPage, filteredInventory.length)} of {filteredInventory.length} items
                </p>
                <button
                  onClick={() => {
                    fetchInventory();
                    setInventoryPage(1);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-eco-primary-600 hover:text-eco-primary-700 font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="card text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No Inventory Items
                </h2>
                <p className="text-gray-600">
                  {inventorySearchQuery ? 'No items match your search' : 'Inventory is empty'}
                </p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          onClick={() => handleInventorySort('item_name')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        >
                          <div className="flex items-center gap-2">
                            Item Name
                            <SortIcon columnKey="item_name" isInventory={true} />
                          </div>
                        </th>
                        <th
                          onClick={() => handleInventorySort('category')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        >
                          <div className="flex items-center gap-2">
                            Category
                            <SortIcon columnKey="category" isInventory={true} />
                          </div>
                        </th>
                        <th
                          onClick={() => handleInventorySort('quantity')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        >
                          <div className="flex items-center gap-2">
                            Quantity
                            <SortIcon columnKey="quantity" isInventory={true} />
                          </div>
                        </th>
                        <th
                          onClick={() => handleInventorySort('last_updated')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        >
                          <div className="flex items-center gap-2">
                            Last Updated
                            <SortIcon columnKey="last_updated" isInventory={true} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        const startIdx = (inventoryPage - 1) * inventoryPerPage;
                        const endIdx = startIdx + inventoryPerPage;
                        const paginatedItems = filteredInventory.slice(startIdx, endIdx);

                        return paginatedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {item.item_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {item.category || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-semibold ${
                                item.quantity === 0 ? 'text-red-600' :
                                item.quantity < 5 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.last_updated).toLocaleDateString()}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {(() => {
                  const totalPages = Math.ceil(filteredInventory.length / inventoryPerPage);

                  if (totalPages <= 1) return null;

                  return (
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => setInventoryPage(Math.max(1, inventoryPage - 1))}
                            disabled={inventoryPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setInventoryPage(Math.min(totalPages, inventoryPage + 1))}
                            disabled={inventoryPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Page <span className="font-medium">{inventoryPage}</span> of{' '}
                              <span className="font-medium">{totalPages}</span>
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => setInventoryPage(1)}
                                disabled={inventoryPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">First</span>
                                <ChevronDown className="h-5 w-5 rotate-90" />
                                <ChevronDown className="h-5 w-5 rotate-90 -ml-3" />
                              </button>
                              <button
                                onClick={() => setInventoryPage(Math.max(1, inventoryPage - 1))}
                                disabled={inventoryPage === 1}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">Previous</span>
                                <ChevronDown className="h-5 w-5 rotate-90" />
                              </button>

                              {/* Page Numbers */}
                              {(() => {
                                const pages = [];
                                const showPages = 5;
                                let startPage = Math.max(1, inventoryPage - Math.floor(showPages / 2));
                                let endPage = Math.min(totalPages, startPage + showPages - 1);

                                if (endPage - startPage < showPages - 1) {
                                  startPage = Math.max(1, endPage - showPages + 1);
                                }

                                for (let i = startPage; i <= endPage; i++) {
                                  pages.push(
                                    <button
                                      key={i}
                                      onClick={() => setInventoryPage(i)}
                                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                        i === inventoryPage
                                          ? 'z-10 bg-eco-primary-50 border-eco-primary-500 text-eco-primary-600'
                                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                      }`}
                                    >
                                      {i}
                                    </button>
                                  );
                                }
                                return pages;
                              })()}

                              <button
                                onClick={() => setInventoryPage(Math.min(totalPages, inventoryPage + 1))}
                                disabled={inventoryPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">Next</span>
                                <ChevronDown className="h-5 w-5 -rotate-90" />
                              </button>
                              <button
                                onClick={() => setInventoryPage(totalPages)}
                                disabled={inventoryPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">Last</span>
                                <ChevronDown className="h-5 w-5 -rotate-90" />
                                <ChevronDown className="h-5 w-5 -rotate-90 -ml-3" />
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DatabaseViewer;
