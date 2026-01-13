import { useState } from 'react';
import { photoAPI } from '../services/api';
import toast from 'react-hot-toast';

function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState(null);

  const uploadPhoto = async (file) => {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    setUploading(true);
    setError(null);

    try {
      const photoUrl = await photoAPI.uploadPhoto(file);
      setUploadedUrl(photoUrl);
      toast.success('Photo uploaded successfully!');
      return { success: true, url: photoUrl };
    } catch (err) {
      console.error('Error uploading photo:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to upload photo';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploadedUrl(null);
    setError(null);
  };

  return {
    uploadPhoto,
    uploading,
    uploadedUrl,
    error,
    reset
  };
}

export default usePhotoUpload;
