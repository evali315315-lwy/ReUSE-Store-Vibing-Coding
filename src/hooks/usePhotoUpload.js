import { useState } from 'react';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const filename = `donations/${timestamp}-${file.name}`;

      // Create storage reference
      const storageRef = ref(storage, filename);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const photoUrl = await getDownloadURL(storageRef);

      setUploadedUrl(photoUrl);
      toast.success('Photo uploaded successfully!');
      return { success: true, url: photoUrl };
    } catch (err) {
      console.error('Error uploading photo:', err);
      const errorMsg = err.message || 'Failed to upload photo';
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
