import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const checkinSchema = z.object({
  checkoutId: z.string().min(1, 'Please select a checkout'),
  conditionAtReturn: z.enum(['Good', 'Fair', 'Needs Repair', 'Damaged', 'Lost']),
  notesReturn: z.string().optional(),
  checkedInBy: z.string().min(1, 'Your name is required')
});

const FridgeCheckinForm = ({ checkout, activeCheckouts, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCheckoutInfo, setSelectedCheckoutInfo] = useState(checkout);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      checkoutId: checkout?.id?.toString() || '',
      conditionAtReturn: 'Good'
    }
  });

  const watchCheckoutId = watch('checkoutId');

  useEffect(() => {
    if (watchCheckoutId && !checkout) {
      const found = activeCheckouts.find(c => c.id === parseInt(watchCheckoutId));
      setSelectedCheckoutInfo(found);
    }
  }, [watchCheckoutId, activeCheckouts, checkout]);

  // Filter checkouts based on search query
  const filteredCheckouts = activeCheckouts.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.fridge_number?.toLowerCase().includes(query) ||
      c.student_name?.toLowerCase().includes(query) ||
      c.housing_assignment?.toLowerCase().includes(query) ||
      c.student_email?.toLowerCase().includes(query)
    );
  });

  const handleCheckoutSelect = (checkoutItem) => {
    setValue('checkoutId', checkoutItem.id.toString());
    setSelectedCheckoutInfo(checkoutItem);
    setSearchQuery(`${checkoutItem.fridge_number} - ${checkoutItem.student_name}`);
    setShowResults(false);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.patch(`${API_URL}/fridges/checkout/${data.checkoutId}/return`, {
        conditionAtReturn: data.conditionAtReturn,
        notesReturn: data.notesReturn,
        checkedInBy: data.checkedInBy
      });
      onSuccess();
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.response?.data?.error || 'Failed to check in fridge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card max-w-6xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-eco-primary-600 hover:text-eco-primary-700 mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Overview
      </button>

      <h2 className="text-2xl font-bold text-eco-primary-800 mb-6">Check In Returned Fridge</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Checkout Selection (if not pre-selected) */}
        {!checkout && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Checkout to Return <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  className="input pl-10 w-full"
                  placeholder="Search by fridge number, student name, housing, or email..."
                />
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchQuery && filteredCheckouts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {filteredCheckouts.map(c => {
                    const isOverdue = new Date(c.expected_return_date) < new Date();
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleCheckoutSelect(c)}
                        className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {c.fridge_number} - {c.student_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {c.housing_assignment} • {c.student_email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Checked out: {new Date(c.checkout_date).toLocaleDateString()}
                            </p>
                          </div>
                          {isOverdue && (
                            <span className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No Results Message */}
              {showResults && searchQuery && filteredCheckouts.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                  <p className="text-gray-500 text-center">No checkouts found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
            {errors.checkoutId && (
              <p className="mt-1 text-sm text-red-600">{errors.checkoutId.message}</p>
            )}
          </div>
        )}

        {/* Display Checkout Info */}
        {selectedCheckoutInfo && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Checkout Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Fridge:</span>
                <span className="ml-2 font-medium">{selectedCheckoutInfo.fridge_number}</span>
              </div>
              <div>
                <span className="text-gray-600">Student:</span>
                <span className="ml-2 font-medium">{selectedCheckoutInfo.student_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Housing:</span>
                <span className="ml-2 font-medium">{selectedCheckoutInfo.housing_assignment}</span>
              </div>
              <div>
                <span className="text-gray-600">Checked Out:</span>
                <span className="ml-2 font-medium">
                  {new Date(selectedCheckoutInfo.checkout_date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Condition at Checkout:</span>
                <span className="ml-2 font-medium">{selectedCheckoutInfo.condition_at_checkout}</span>
              </div>
              <div>
                <span className="text-gray-600">Expected Return:</span>
                <span className={`ml-2 font-medium ${
                  new Date(selectedCheckoutInfo.expected_return_date) < new Date()
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}>
                  {new Date(selectedCheckoutInfo.expected_return_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Return Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition at Return <span className="text-red-500">*</span>
          </label>
          <select {...register('conditionAtReturn')} className="input">
            <option value="Good">Good - No issues</option>
            <option value="Fair">Fair - Minor wear</option>
            <option value="Needs Repair">Needs Repair - Functional but needs fixing</option>
            <option value="Damaged">Damaged - Not functional</option>
            <option value="Lost">Lost - Not returned</option>
          </select>
          {errors.conditionAtReturn && (
            <p className="mt-1 text-sm text-red-600">{errors.conditionAtReturn.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Return Notes (optional)
          </label>
          <textarea
            {...register('notesReturn')}
            className="input"
            rows="4"
            placeholder="Document any damage, missing parts, cleaning needed, or other observations..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name (Staff Member) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('checkedInBy')}
            className="input"
            placeholder="Staff Name"
          />
          {errors.checkedInBy && (
            <p className="mt-1 text-sm text-red-600">{errors.checkedInBy.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? 'Processing...' : 'Check In Fridge'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default FridgeCheckinForm;
