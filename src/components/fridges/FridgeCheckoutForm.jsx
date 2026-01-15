import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const checkoutSchema = z.object({
  fridgeId: z.string().min(1, 'Please select a fridge'),
  studentName: z.string().min(1, 'Student name is required'),
  studentEmail: z.string().email('Valid email required').endsWith('@haverford.edu', 'Must be Haverford email'),
  studentId: z.string().optional(),
  housingAssignment: z.string().min(1, 'Housing assignment is required'),
  phoneNumber: z.string().regex(/^[\d\s\-\(\)]*$/, 'Phone number can only contain numbers, spaces, hyphens, and parentheses').optional(),
  expectedReturnDate: z.string().min(1, 'Expected return date is required'),
  conditionAtCheckout: z.enum(['Good', 'Fair', 'Needs Repair']),
  notesCheckout: z.string().optional(),
  checkedOutBy: z.string().min(1, 'Your name is required')
});

const FridgeCheckoutForm = ({ fridges, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      conditionAtCheckout: 'Good',
      expectedReturnDate: new Date(new Date().getFullYear(), 4, 31).toISOString().split('T')[0] // May 31st
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/fridges/checkout`, {
        ...data,
        fridgeId: parseInt(data.fridgeId)
      });
      onSuccess();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Failed to check out fridge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card max-w-3xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-eco-primary-600 hover:text-eco-primary-700 mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Overview
      </button>

      <h2 className="text-2xl font-bold text-eco-primary-800 mb-6">Check Out Fridge</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Fridge Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Fridge <span className="text-red-500">*</span>
          </label>
          <select
            {...register('fridgeId')}
            className="input"
          >
            <option value="">Choose a fridge...</option>
            {fridges.map(fridge => (
              <option key={fridge.id} value={fridge.id}>
                {fridge.fridge_number} - {fridge.brand || 'Unknown'} {fridge.model || ''} ({fridge.size || 'Standard'})
              </option>
            ))}
          </select>
          {errors.fridgeId && (
            <p className="mt-1 text-sm text-red-600">{errors.fridgeId.message}</p>
          )}
        </div>

        {/* Student Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('studentName')}
              className="input"
              placeholder="John Doe"
            />
            {errors.studentName && (
              <p className="mt-1 text-sm text-red-600">{errors.studentName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('studentEmail')}
              className="input"
              placeholder="jdoe@haverford.edu"
            />
            {errors.studentEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.studentEmail.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student ID (optional)
            </label>
            <input
              type="text"
              {...register('studentId')}
              className="input"
              placeholder="12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (optional)
            </label>
            <input
              type="tel"
              {...register('phoneNumber')}
              className="input"
              placeholder="(555) 123-4567"
              pattern="[\d\s\-\(\)]*"
              onInput={(e) => {
                // Remove any alphabetic characters as user types
                e.target.value = e.target.value.replace(/[a-zA-Z]/g, '');
              }}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Housing Assignment <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('housingAssignment')}
            className="input"
            placeholder="Lloyd 201"
          />
          {errors.housingAssignment && (
            <p className="mt-1 text-sm text-red-600">{errors.housingAssignment.message}</p>
          )}
        </div>

        {/* Checkout Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Return Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('expectedReturnDate')}
              className="input"
            />
            {errors.expectedReturnDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedReturnDate.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Usually end of academic year (May 31st)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition at Checkout <span className="text-red-500">*</span>
            </label>
            <select {...register('conditionAtCheckout')} className="input">
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Needs Repair">Needs Repair</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            {...register('notesCheckout')}
            className="input"
            rows="3"
            placeholder="Any special notes about the fridge or checkout..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name (Staff Member) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('checkedOutBy')}
            className="input"
            placeholder="Staff Name"
          />
          {errors.checkedOutBy && (
            <p className="mt-1 text-sm text-red-600">{errors.checkedOutBy.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? 'Processing...' : 'Check Out Fridge'}
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

export default FridgeCheckoutForm;
