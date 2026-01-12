import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import FormSuccess from './FormSuccess';

// Validation schema
const donationSchema = z.object({
  donorName: z.string().min(1, 'Donor name is required').max(100, 'Name is too long'),
  donorEmail: z.string().email('Please enter a valid email address'),
  objectName: z.string().min(1, 'Object name is required').max(100, 'Object name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
});

function DonationForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(donationSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    // Simulate API call (will be replaced with actual Google Sheets integration)
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Donation data:', data);

    setIsSubmitting(false);
    setIsSubmitted(true);
    reset();
  };

  const handleNewDonation = () => {
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return <FormSuccess onNewDonation={handleNewDonation} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-eco-primary-100 rounded-full mb-4">
          <Package className="w-12 h-12 text-eco-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-eco-primary-800 mb-3 font-display">
          Log a Donation
        </h1>
        <p className="text-gray-600">
          Enter the donor's information and details about the donated item(s)
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card">
        {/* Donor Name */}
        <div className="mb-6">
          <label htmlFor="donorName" className="block text-sm font-semibold text-gray-700 mb-2">
            Donor Name <span className="text-red-500">*</span>
          </label>
          <input
            id="donorName"
            type="text"
            {...register('donorName')}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.donorName
                ? 'border-red-300 focus:ring-red-500'
                : 'border-eco-primary-300 focus:ring-eco-primary-500'
            }`}
            placeholder="Enter donor's full name"
            disabled={isSubmitting}
          />
          {errors.donorName && (
            <p className="mt-1 text-sm text-red-600">{errors.donorName.message}</p>
          )}
        </div>

        {/* Donor Email */}
        <div className="mb-6">
          <label htmlFor="donorEmail" className="block text-sm font-semibold text-gray-700 mb-2">
            Donor Email <span className="text-red-500">*</span>
          </label>
          <input
            id="donorEmail"
            type="email"
            {...register('donorEmail')}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.donorEmail
                ? 'border-red-300 focus:ring-red-500'
                : 'border-eco-primary-300 focus:ring-eco-primary-500'
            }`}
            placeholder="donor@haverford.edu"
            disabled={isSubmitting}
          />
          {errors.donorEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.donorEmail.message}</p>
          )}
        </div>

        {/* Object Name */}
        <div className="mb-6">
          <label htmlFor="objectName" className="block text-sm font-semibold text-gray-700 mb-2">
            Object Name <span className="text-red-500">*</span>
          </label>
          <input
            id="objectName"
            type="text"
            {...register('objectName')}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.objectName
                ? 'border-red-300 focus:ring-red-500'
                : 'border-eco-primary-300 focus:ring-eco-primary-500'
            }`}
            placeholder="e.g., Desk lamp, Textbooks, Mini fridge"
            disabled={isSubmitting}
          />
          {errors.objectName && (
            <p className="mt-1 text-sm text-red-600">{errors.objectName.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none ${
              errors.description
                ? 'border-red-300 focus:ring-red-500'
                : 'border-eco-primary-300 focus:ring-eco-primary-500'
            }`}
            placeholder="Additional details about the item(s), condition, quantity, etc."
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Max 500 characters</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Clear Form
          </button>
          <button
            type="submit"
            className="btn-primary min-w-[150px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" text="" />
                Submitting...
              </span>
            ) : (
              'Submit Donation'
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-eco-primary-50 rounded-lg border border-eco-primary-200">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> Please ensure all donated items are clean and in good, working condition.
          Large items or bulk donations can be arranged by contacting{' '}
          <a href="mailto:reuse@haverford.edu" className="text-eco-primary-600 hover:text-eco-primary-700 underline">
            reuse@haverford.edu
          </a>
        </p>
      </div>
    </div>
  );
}

export default DonationForm;
