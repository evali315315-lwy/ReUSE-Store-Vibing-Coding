import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { Readable } from 'stream';

/**
 * Google Drive Service: Handle photo uploads to Google Drive
 */

let drive = null;

/**
 * Initialize Google Drive API with service account
 */
function initializeDrive() {
  if (drive) return drive;

  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    console.warn('⚠️  GOOGLE_SERVICE_ACCOUNT_PATH not set - photo upload will not work');
    return null;
  }

  try {
    const credentials = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    drive = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive API initialized');

    return drive;
  } catch (error) {
    console.error('❌ Failed to initialize Google Drive API:', error.message);
    return null;
  }
}

export const driveService = {
  /**
   * Upload photo to Google Drive
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} mimeType - MIME type (image/jpeg, image/png, etc.)
   * @returns {Promise<string>} Public URL to the uploaded file
   */
  async uploadPhoto(fileBuffer, fileName, mimeType) {
    const driveClient = initializeDrive();

    if (!driveClient) {
      throw new Error('Google Drive API not initialized');
    }

    const folderId = process.env.DRIVE_FOLDER_ID;

    if (!folderId) {
      throw new Error('DRIVE_FOLDER_ID environment variable not set');
    }

    try {
      // Convert buffer to readable stream
      const stream = Readable.from(fileBuffer);

      // Upload file to Google Drive
      const response = await driveClient.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType
        },
        media: {
          mimeType,
          body: stream
        },
        fields: 'id, webViewLink, webContentLink'
      });

      const fileId = response.data.id;

      // Make file publicly accessible
      await driveClient.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Return direct link to the file
      const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;

      return directLink;
    } catch (error) {
      console.error('❌ Failed to upload to Google Drive:', error.message);
      throw new Error(`Failed to upload photo: ${error.message}`);
    }
  },

  /**
   * Delete photo from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<void>}
   */
  async deletePhoto(fileId) {
    const driveClient = initializeDrive();

    if (!driveClient) {
      throw new Error('Google Drive API not initialized');
    }

    try {
      await driveClient.files.delete({ fileId });
    } catch (error) {
      console.error('❌ Failed to delete from Google Drive:', error.message);
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  },

  /**
   * Extract file ID from Google Drive URL
   * @param {string} url - Google Drive URL
   * @returns {string|null} File ID or null
   */
  extractFileId(url) {
    const patterns = [
      /\/file\/d\/([^\/]+)/,
      /id=([^&]+)/,
      /\/d\/([^\/\?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
};
