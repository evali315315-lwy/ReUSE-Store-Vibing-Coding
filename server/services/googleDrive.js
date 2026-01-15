import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Google Drive Service for uploading checkout photos
 *
 * Setup Instructions:
 * 1. Go to Google Cloud Console (console.cloud.google.com)
 * 2. Create a new project or select existing one
 * 3. Enable Google Drive API
 * 4. Create OAuth 2.0 credentials or Service Account
 * 5. Download credentials JSON file
 * 6. Add credentials to .env.local file or set up environment variables
 */

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
  }

  /**
   * Initialize Google Drive API client
   * Uses service account credentials for server-to-server auth
   */
  async initialize() {
    try {
      // Check if credentials are provided
      if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
        console.warn('⚠️  Google Drive credentials not configured. Photo uploads will be stored as base64 in database.');
        console.warn('   To enable Google Drive uploads, add the following to .env.local:');
        console.warn('   - GOOGLE_DRIVE_CLIENT_EMAIL');
        console.warn('   - GOOGLE_DRIVE_PRIVATE_KEY');
        console.warn('   - GOOGLE_DRIVE_FOLDER_ID (optional)');
        return false;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      console.log('✅ Google Drive service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive service:', error.message);
      return false;
    }
  }

  /**
   * Upload a photo to Google Drive
   * @param {string} base64Data - Base64 encoded image data
   * @param {string} filename - Name for the file
   * @returns {Promise<string>} - Public URL or base64 data
   */
  async uploadPhoto(base64Data, filename) {
    // If Google Drive is not configured, return base64 data as fallback
    if (!this.drive) {
      console.warn('📷 Google Drive not configured, storing as base64');
      return base64Data; // Return base64 as image_url
    }

    try {
      // Remove data URL prefix if present
      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Image, 'base64');

      // Detect MIME type from base64 data URL
      let mimeType = 'image/jpeg';
      const match = base64Data.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mimeType = match[1];
      }

      // Create readable stream from buffer
      const stream = Readable.from(buffer);

      // Prepare file metadata
      const fileMetadata = {
        name: filename,
        parents: this.folderId ? [this.folderId] : [],
      };

      // Upload file to Google Drive
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType,
          body: stream,
        },
        fields: 'id, webViewLink, webContentLink',
      });

      const fileId = response.data.id;

      // Make file publicly accessible
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Get direct link to image
      const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;

      console.log(`✅ Photo uploaded to Google Drive: ${filename}`);
      return directLink;

    } catch (error) {
      console.error('❌ Error uploading to Google Drive:', error.message);
      // Fallback to base64 if upload fails
      console.warn('📷 Falling back to base64 storage');
      return base64Data;
    }
  }

  /**
   * Delete a photo from Google Drive
   * @param {string} fileIdOrUrl - File ID or Google Drive URL
   * @returns {Promise<boolean>}
   */
  async deletePhoto(fileIdOrUrl) {
    if (!this.drive) return false;

    try {
      // Extract file ID from URL if necessary
      let fileId = fileIdOrUrl;
      const match = fileIdOrUrl.match(/[?&]id=([^&]+)/);
      if (match) {
        fileId = match[1];
      }

      await this.drive.files.delete({ fileId });
      console.log(`✅ Photo deleted from Google Drive: ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting from Google Drive:', error.message);
      return false;
    }
  }

  /**
   * Create a folder in Google Drive for checkout photos
   * @param {string} folderName
   * @returns {Promise<string>} Folder ID
   */
  async createFolder(folderName) {
    if (!this.drive) return null;

    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });

      const folderId = response.data.id;
      console.log(`✅ Folder created: ${folderName} (ID: ${folderId})`);
      return folderId;
    } catch (error) {
      console.error('❌ Error creating folder:', error.message);
      return null;
    }
  }
}

// Create singleton instance
const googleDriveService = new GoogleDriveService();

export default googleDriveService;
