import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import FormField from '../common/FormField';
import LoadingSpinner from '../common/LoadingSpinner';

function PhotoUpload({
  value, // Photo URL or preview URL
  onChange,
  onUpload,
  uploading = false,
  error,
  disabled = false
}) {
  const [preview, setPreview] = useState(value || null);
  const [uploadError, setUploadError] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setUploadError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setUploadError('File is too large. Maximum size is 5MB.');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setUploadError('Invalid file type. Please upload a JPG, PNG, or WEBP image.');
      } else {
        setUploadError(rejection.errors[0].message);
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Call parent's upload handler
      if (onUpload) {
        onUpload(file);
      }

      // Update form value with file object
      onChange(file);
    }
  }, [onChange, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: disabled || uploading
  });

  const handleRemove = () => {
    setPreview(null);
    setUploadError(null);
    onChange(null);
  };

  const displayError = uploadError || error;

  return (
    <FormField
      label="Photo"
      id="photo"
      error={displayError}
      helpText="JPG, PNG, or WEBP. Max 5MB. Optional but recommended."
    >
      {preview ? (
        // Preview mode
        <div className="relative">
          <div className="border-2 border-eco-primary-200 rounded-lg p-4 bg-eco-primary-50">
            <div className="flex items-start gap-4">
              <img
                src={preview}
                alt="Upload preview"
                className="w-32 h-32 object-cover rounded-lg border border-eco-primary-300"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Photo ready to upload
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Photo will be uploaded when you submit the form
                </p>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-eco-primary-600">
                    <LoadingSpinner size="sm" text="Uploading photo..." />
                  </div>
                )}
              </div>
              {!uploading && !disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                  title="Remove photo"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Upload zone
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-eco-primary-500 bg-eco-primary-50'
              : displayError
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-eco-primary-400 hover:bg-eco-primary-50/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-3">
            {displayError ? (
              <AlertCircle className="w-12 h-12 text-red-400" />
            ) : isDragActive ? (
              <Upload className="w-12 h-12 text-eco-primary-500 animate-bounce" />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-400" />
            )}

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                {isDragActive
                  ? 'Drop photo here'
                  : 'Drag & drop photo, or click to select'}
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, or WEBP up to 5MB
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={disabled}
            >
              Choose File
            </button>
          </div>
        </div>
      )}
    </FormField>
  );
}

export default PhotoUpload;
