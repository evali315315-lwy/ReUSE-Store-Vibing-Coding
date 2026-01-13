import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { productAPI } from '../../services/api';
import { Package, Calendar } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import FormField from '../common/FormField';
import FormSuccess from './FormSuccess';
import DonorLookup from './DonorLookup';
import CategorySelector from './CategorySelector';
import PhotoUpload from './PhotoUpload';
import useDonorLookup from '../../hooks/useDonorLookup';
import useCategories from '../../hooks/useCategories';
import usePhotoUpload from '../../hooks/usePhotoUpload';

// Enhanced validation schema - ALL FIELDS REQUIRED
const productSchema = z.object({
  ownerName: z.string().min(1, 'Owner name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  housingAssignment: z.string().min(1, 'Housing assignment is required').max(100, 'Housing assignment is too long'),
  graduationYear: z.string()
    .min(1, 'Graduation year is required')
    .regex(/^\d{4}$/, 'Must be a 4-digit year')
    .refine((year) => {
      const y = parseInt(year);
      return y >= 2024 && y <= 2030;
    }, 'Year must be between 2024 and 2030'),
  category: z.string().min(1, 'Category is required'),
  itemDescription: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description is too long'),
  photo: z.any().refine((file) => file !== null && file !== undefined, {
    message: 'Photo is required',
  }),
});

function ProductLogForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);

  const { donors, loading: donorsLoading } = useDonorLookup();
  const { categories, loading: categoriesLoading, createCategory } = useCategories();
  const { uploadPhoto, uploading: photoUploading } = usePhotoUpload();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ownerName: '',
      email: '',
      housingAssignment: '',
      graduationYear: '',
      category: '',
      itemDescription: '',
      photo: null,
    }
  });

  const watchedPhoto = watch('photo');

  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    // Auto-fill related fields
    setValue('ownerName', donor.name);
    setValue('email', donor.email);
    if (donor.housing) {
      setValue('housingAssignment', donor.housing);
    }
    if (donor.gradYear) {
      setValue('graduationYear', donor.gradYear.toString());
    }
  };

  const handleCategoryCreate = async (categoryName) => {
    const result = await createCategory(categoryName);
    if (result.success) {
      setValue('category', categoryName);
    }
  };

  const handlePhotoUploadChange = async (file) => {
    setValue('photo', file);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      let photoUrl = null;

      // Upload photo if provided
      if (data.photo) {
        const uploadResult = await uploadPhoto(data.photo);
        if (uploadResult.success) {
          photoUrl = uploadResult.url;
        }
      }

      // Prepare submission data
      const submissionData = {
        ownerName: data.ownerName,
        email: data.email,
        housingAssignment: data.housingAssignment,
        graduationYear: data.graduationYear,
        category: data.category,
        itemDescription: data.itemDescription,
        photoUrl: photoUrl,
      };

      // Submit via API service (handles both backends)
      await productAPI.submitProduct(submissionData);

      toast.success('Item logged successfully!');
      setIsSubmitted(true);
      reset();
      setSelectedDonor(null);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to log item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewDonation = () => {
    setIsSubmitted(false);
    reset();
    setSelectedDonor(null);
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
          Log Inventory Item
        </h1>
        <p className="text-gray-600">
          Enter owner information and item details
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card">
        {/* Date (read-only, auto-generated) */}
        <FormField
          label="Date"
          id="date"
          helpText="Auto-generated"
        >
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-gray-700">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </FormField>

        {/* Owner's Name - with autocomplete */}
        <Controller
          name="ownerName"
          control={control}
          render={({ field }) => (
            <DonorLookup
              field="name"
              value={field.value}
              onChange={field.onChange}
              onDonorSelect={handleDonorSelect}
              donors={donors}
              loading={donorsLoading}
              error={errors.ownerName?.message}
              disabled={isSubmitting}
            />
          )}
        />

        {/* Email - with autocomplete */}
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <DonorLookup
              field="email"
              value={field.value}
              onChange={field.onChange}
              onDonorSelect={handleDonorSelect}
              donors={donors}
              loading={donorsLoading}
              error={errors.email?.message}
              disabled={isSubmitting}
            />
          )}
        />

        {/* Housing Assignment */}
        <FormField
          label="Housing Assignment"
          id="housingAssignment"
          required
          error={errors.housingAssignment?.message}
          helpText="Dorm or residential area"
        >
          <input
            id="housingAssignment"
            type="text"
            {...register('housingAssignment')}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.housingAssignment
                ? 'border-red-300 focus:ring-red-500'
                : 'border-eco-primary-300 focus:ring-eco-primary-500'
            }`}
            placeholder="e.g., Barclay Hall, HCA, Lloyd"
            disabled={isSubmitting}
          />
        </FormField>

        {/* Graduation Year */}
        <FormField
          label="Graduation Year"
          id="graduationYear"
          required
          error={errors.graduationYear?.message}
          helpText="4-digit year (2024-2030)"
        >
          <input
            id="graduationYear"
            type="text"
            {...register('graduationYear')}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.graduationYear
                ? 'border-red-300 focus:ring-red-500'
                : 'border-eco-primary-300 focus:ring-eco-primary-500'
            }`}
            placeholder="e.g., 2025"
            maxLength={4}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Category - with autocomplete and create-new */}
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CategorySelector
              value={field.value}
              onChange={field.onChange}
              categories={categories}
              onCreateCategory={handleCategoryCreate}
              loading={categoriesLoading}
              error={errors.category?.message}
              disabled={isSubmitting}
            />
          )}
        />

        {/* Item Description - NOW REQUIRED */}
        <FormField
          label="Item Description"
          id="itemDescription"
          required
          error={errors.itemDescription?.message}
          helpText="Min 10 characters, max 500. Be specific about condition, size, etc."
        >
          <textarea
            id="itemDescription"
            {...register('itemDescription')}
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none ${
              errors.itemDescription
                ? 'border-red-300 focus:ring-red-500'
                : 'border-eco-primary-300 focus:ring-eco-primary-500'
            }`}
            placeholder="Describe the item's condition, size, brand, any defects, etc."
            disabled={isSubmitting}
          />
        </FormField>

        {/* Photo Upload */}
        <Controller
          name="photo"
          control={control}
          render={({ field }) => (
            <PhotoUpload
              value={watchedPhoto}
              onChange={handlePhotoUploadChange}
              onUpload={uploadPhoto}
              uploading={photoUploading}
              error={errors.photo?.message}
              disabled={isSubmitting}
            />
          )}
        />

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => {
              reset();
              setSelectedDonor(null);
            }}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Clear Form
          </button>
          <button
            type="submit"
            className="btn-primary min-w-[150px]"
            disabled={isSubmitting || photoUploading}
          >
            {isSubmitting || photoUploading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" text="" />
                {photoUploading ? 'Uploading...' : 'Submitting...'}
              </span>
            ) : (
              'Log Item'
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-eco-primary-50 rounded-lg border border-eco-primary-200">
        <p className="text-sm text-gray-700">
          <strong>Tips:</strong> Start typing a name or email to search past donors.
          Categories are shared - create new ones as needed. Photos help identify items quickly!
        </p>
      </div>
    </div>
  );
}

export default ProductLogForm;
