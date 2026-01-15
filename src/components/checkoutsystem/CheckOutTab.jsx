import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Plus, Trash2, Save, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentLookup from './StudentLookup';
import ItemSearch from './ItemSearch';
import { useStudentLookup } from '../../hooks/useStudentLookup';
import { checkoutAPI } from '../../services/api';

// Housing options from database
const HOUSING_OPTIONS = [
  'HCA', 'Barclay', 'North Dorms', 'Kim', 'Tritton', 'Leeds', 'Gummere',
  'Lloyd', 'Drinker', 'BCC', 'LCC', 'Q House', 'Railroad',
  'Cadbury', 'Yarnall', '773 College Ave', 'Off Campus', 'Staff/Faculty Office'
];

const checkoutSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  studentEmail: z.string().email('Valid email is required'),
  housing: z.string().optional(),
  gradYear: z.string().regex(/^\d{4}$/, 'Must be 4-digit year').optional(),
  notes: z.string().optional()
});

function CheckOutTab() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      studentName: '',
      studentEmail: '',
      housing: '',
      gradYear: '',
      notes: ''
    }
  });

  const { students, loading: loadingStudents, searchStudents } = useStudentLookup();
  const [selectedItems, setSelectedItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [checkoutPhoto, setCheckoutPhoto] = useState(null);
  const [checkoutPhotoFile, setCheckoutPhotoFile] = useState(null);

  const currentDate = new Date().toLocaleDateString();

  // Handle student selection from lookup
  const handleStudentSelect = (student) => {
    setValue('studentName', student.name);
    setValue('studentEmail', student.email);
    if (student.housing_assignment) setValue('housing', student.housing_assignment);
    if (student.gradYear) setValue('gradYear', student.gradYear.toString());
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    const exists = selectedItems.find(i => i.id === item.id);
    if (!exists) {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
      setShowItemSearch(false);
    }
  };

  // Update item quantity
  const updateItemQuantity = (itemId, quantity) => {
    setSelectedItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.available_quantity)) } : item
      )
    );
  };

  // Remove item
  const removeItem = (itemId) => {
    setSelectedItems(items => items.filter(item => item.id !== itemId));
  };

  // Handle photo upload for the entire checkout
  const handlePhotoUpload = (file) => {
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      setCheckoutPhoto(reader.result);
      setCheckoutPhotoFile(file);
      toast.success('Photo uploaded successfully');
    };
    reader.onerror = () => {
      toast.error('Failed to upload photo');
    };
    reader.readAsDataURL(file);
  };

  // Remove photo
  const removePhoto = () => {
    setCheckoutPhoto(null);
    setCheckoutPhotoFile(null);
  };

  // Submit checkout
  const onSubmit = async (data) => {
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Check if checkout photo is uploaded
    if (!checkoutPhoto) {
      toast.error('Please upload a photo of all checked-out items');
      return;
    }

    setSubmitting(true);

    try {
      const checkoutData = {
        student: {
          name: data.studentName,
          email: data.studentEmail,
          housing: data.housing || null,
          gradYear: data.gradYear || null
        },
        items: selectedItems.map(item => ({
          type: 'item',
          itemId: item.id,
          quantity: item.quantity
        })),
        checkedOutBy: 'worker@haverford.edu', // TODO: Get from auth context
        notes: data.notes || null
      };

      const result = await checkoutAPI.createCheckout(checkoutData);

      toast.success('Items checked out successfully!');

      // Reset form
      setValue('studentName', '');
      setValue('studentEmail', '');
      setValue('housing', '');
      setValue('gradYear', '');
      setValue('notes', '');
      setSelectedItems([]);
      setCheckoutPhoto(null);
      setCheckoutPhotoFile(null);

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Failed to checkout items');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="bg-eco-primary-50 p-4 rounded-lg border border-eco-primary-200">
        <h2 className="text-2xl font-bold text-eco-primary-900 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Check-Out Items
        </h2>
        <p className="text-sm text-eco-primary-700 mt-1">Date: {currentDate}</p>
      </div>

      {/* Student Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student Name with Lookup */}
          <StudentLookup
            field="name"
            value={watch('studentName')}
            onChange={(value) => {
              setValue('studentName', value);
              searchStudents(value);
            }}
            onStudentSelect={handleStudentSelect}
            students={students}
            loading={loadingStudents}
            error={errors.studentName?.message}
          />

          {/* Student Email with Lookup */}
          <StudentLookup
            field="email"
            value={watch('studentEmail')}
            onChange={(value) => {
              setValue('studentEmail', value);
              searchStudents(value);
            }}
            onStudentSelect={handleStudentSelect}
            students={students}
            loading={loadingStudents}
            error={errors.studentEmail?.message}
          />

          {/* Housing Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Housing Assignment
            </label>
            <select
              {...register('housing')}
              className="w-full px-3 py-3 border border-eco-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
            >
              <option value="">-- Select housing --</option>
              {HOUSING_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Graduation Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Graduation Year
            </label>
            <input
              type="text"
              {...register('gradYear')}
              placeholder="e.g., 2025"
              maxLength={4}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.gradYear
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-eco-primary-300 focus:ring-eco-primary-500'
              }`}
            />
            {errors.gradYear && (
              <p className="mt-1 text-sm text-red-600">{errors.gradYear.message}</p>
            )}
          </div>
        </div>

        {/* Info Tip */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-blue-600 text-lg">💡</span>
          <p className="text-xs text-gray-700">
            <strong>Tip:</strong> Select from dropdown to auto-fill housing and grad year, or type any new student name/email. New students will be saved automatically.
          </p>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Items</h3>
          <button
            type="button"
            onClick={() => setShowItemSearch(!showItemSearch)}
            className="flex items-center gap-2 px-4 py-2 bg-eco-primary-600 text-white rounded-lg hover:bg-eco-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {showItemSearch && (
          <ItemSearch
            onItemSelect={handleItemSelect}
            selectedItems={selectedItems}
          />
        )}

        {/* Selected Items List */}
        {selectedItems.length > 0 && (
          <div className="space-y-4">
            {selectedItems.map(item => (
              <div key={item.id} className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* Item Details */}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">SKU: {item.sku} • Max: {item.available_quantity}</p>
                  </div>

                  {/* Quantity Input */}
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-xs font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={item.available_quantity}
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-center"
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-800 mt-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Photo Section - After Items List */}
      {selectedItems.length > 0 && (
        <div className={`bg-white p-6 rounded-lg shadow-sm border-2 ${!checkoutPhoto ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Checkout Photo <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Take a photo of ALL items being checked out together. This serves as a visual record of what the student is borrowing.
          </p>

          {!checkoutPhoto ? (
            <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <Camera className="w-12 h-12 text-gray-400" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e.target.files[0])}
                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <span className="text-xs text-red-600 font-medium">Photo required before checkout</span>
            </div>
          ) : (
            <div className="space-y-3">
              <img
                src={checkoutPhoto}
                alt="Checkout items"
                className="w-full max-w-md rounded border-2 border-gray-300"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Remove Photo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eco-primary-500"
          placeholder="Any additional notes about this checkout..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-eco-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-eco-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {submitting ? 'Processing...' : 'Complete Check-Out'}
      </button>
    </form>
  );
}

export default CheckOutTab;
