import express from 'express';
import multer from 'multer';
import { driveService } from '../services/driveService.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

/**
 * POST /api/upload
 * Upload photo to Google Drive
 * Content-Type: multipart/form-data
 * Field: photo (file)
 */
router.post('/', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;

    // Upload to Google Drive
    const url = await driveService.uploadPhoto(
      file.buffer,
      fileName,
      file.mimetype
    );

    res.json({ url });
  } catch (error) {
    next(error);
  }
});

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

export default router;
