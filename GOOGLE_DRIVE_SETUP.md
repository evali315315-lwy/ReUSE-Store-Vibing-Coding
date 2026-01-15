# Google Drive Integration Setup Guide

This guide explains how to set up Google Drive integration for storing checkout photos.

## Overview

The checkout system can store photos in two ways:
1. **Google Drive** (recommended for production) - Photos are uploaded to your Google Drive and shared via public links
2. **Base64 in Database** (fallback) - If Google Drive is not configured, photos are stored as base64 strings in the database

## Why Use Google Drive?

- **Better Performance**: Database stays lightweight
- **Easy Sharing**: Photos get shareable URLs
- **Scalability**: No database size concerns
- **Management**: Easy to view/organize photos in Google Drive

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "NEW PROJECT"
3. Enter project name (e.g., "ReUSE-Store-Photos")
4. Click "CREATE"

### Step 2: Enable Google Drive API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and press "ENABLE"

### Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "Service account"
3. Enter service account details:
   - **Name**: `reuse-store-photos`
   - **ID**: (auto-generated)
4. Click "CREATE AND CONTINUE"
5. Skip optional steps and click "DONE"

### Step 4: Generate Service Account Key

1. In the "Credentials" page, find your service account
2. Click on the service account email
3. Go to "KEYS" tab
4. Click "ADD KEY" → "Create new key"
5. Select "JSON" format
6. Click "CREATE" - a JSON file will download

### Step 5: Set Up Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder called "ReUSE Store Checkout Photos"
3. Right-click the folder → "Share"
4. Add the service account email (from Step 3) with "Editor" permission
5. Click "Share"
6. Open the folder and copy the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```

### Step 6: Configure Environment Variables

1. Open the downloaded JSON key file
2. Find these values:
   - `client_email`
   - `private_key`

3. Add to `.env.local`:

```bash
# Google Drive Integration
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-from-step-5
```

**Important Notes:**
- Keep the entire `private_key` including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- The `\n` characters in the private key must be preserved
- Wrap the private key in quotes

### Step 7: Restart Server

```bash
# Stop the server
lsof -ti:3001 | xargs kill -9

# Start the server
npm run server
```

You should see:
```
✅ Google Drive service initialized
```

## Verification

1. Go to the Check-Out tab in your application
2. Complete a checkout with a photo
3. Check the `items` table in the database - `image_url` should contain a Google Drive link:
   ```
   https://drive.google.com/uc?export=view&id=...
   ```
4. Go to Photo Verification page - photos should display correctly
5. Check your Google Drive folder - the photo should be there

## Troubleshooting

### "Google Drive credentials not configured"

**Solution**: Check that all three environment variables are set in `.env.local`:
- `GOOGLE_DRIVE_CLIENT_EMAIL`
- `GOOGLE_DRIVE_PRIVATE_KEY`
- `GOOGLE_DRIVE_FOLDER_ID` (optional but recommended)

### "Error uploading to Google Drive"

**Possible causes:**
1. **Invalid credentials**: Double-check the service account email and private key
2. **API not enabled**: Make sure Google Drive API is enabled in Google Cloud Console
3. **Folder permissions**: Ensure the service account has Editor access to the folder
4. **Quota exceeded**: Google Drive has upload quotas - check your quota in Google Cloud Console

**Fallback**: If upload fails, the system automatically stores photos as base64 in the database

### Photos not displaying in verification page

**Check:**
1. Database `image_url` field - should contain either a Google Drive URL or base64 data
2. If base64, ensure it starts with `data:image/...;base64,`
3. If Google Drive URL, check folder sharing settings
4. Browser console for CORS or loading errors

## Security Notes

- ⚠️ Never commit `.env.local` to git (already in .gitignore)
- ⚠️ Keep service account JSON key file secure
- ⚠️ Service account has access only to the specific folder you shared
- ✅ Uploaded photos are set to public "anyone with link can view"
- ✅ Filenames include timestamp to prevent collisions

## Cost

Google Drive API is **free** for most use cases:
- 1 billion requests/day quota (way more than needed)
- 15 GB free storage per Google account
- Service account usage doesn't count against personal storage

## Maintenance

### Managing Old Photos

Periodically review and delete old photos from Google Drive folder:
1. Sort by date in Google Drive
2. Archive or delete photos from completed checkouts
3. Note: Deleting from Drive won't affect database records (URL will just 404)

### Monitoring Usage

Check API usage in Google Cloud Console:
1. Go to "APIs & Services" → "Dashboard"
2. View Google Drive API usage
3. Set up alerts if approaching quota limits

## Alternative: Base64 Storage

If you choose not to set up Google Drive:
- Photos will be stored directly in the database as base64 strings
- This works fine for small-scale usage
- May cause performance issues with many high-resolution photos
- Database backups will be larger

To use base64 storage: Simply don't configure the Google Drive environment variables.

## Support

If you encounter issues:
1. Check server logs for error messages
2. Verify all setup steps were completed
3. Test with a small test image first
4. Ensure service account has proper permissions
