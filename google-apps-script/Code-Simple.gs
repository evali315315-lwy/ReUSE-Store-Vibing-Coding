// ========================================
// ReUSE Store - Google Apps Script Backend (Simplified)
// ========================================
// This version works with existing sheets that only have name/email
// New submissions will add all the enhanced fields

// CONFIGURATION - UPDATE THESE VALUES
const INVENTORY_SHEET_NAME = 'Sheet1'; // ← Change to your actual sheet name
const CATEGORIES_SHEET_NAME = 'Categories';
const PHOTO_FOLDER_ID = 'YOUR_FOLDER_ID_HERE'; // ← Replace with your folder ID

// Column mapping for EXISTING data (for donor search)
// Adjust these if your columns are different
const EXISTING_DATA_COLUMNS = {
  NAME: 1,   // Column B (index 1) - adjust if different
  EMAIL: 2,  // Column C (index 2) - adjust if different
};

// Column mapping for NEW submissions
// This is the structure that will be used going forward
const NEW_DATA_COLUMNS = {
  DATE: 0,
  NAME: 1,
  EMAIL: 2,
  HOUSING: 3,
  GRAD_YEAR: 4,
  CATEGORY: 5,
  DESCRIPTION: 6,
  PHOTO: 7,
  SUBMISSION_ID: 8
};

// ========================================
// MAIN HANDLERS
// ========================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch(action) {
      case 'submit-product':
        return submitProduct(data);
      case 'create-category':
        return createCategory(data.categoryName, data.workerEmail);
      case 'upload-photo':
        return uploadPhoto(data.base64Data, data.filename);
      default:
        return createErrorResponse('Unknown action: ' + action);
    }
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return createErrorResponse(error.toString());
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;

    switch(action) {
      case 'search-donors':
        return searchDonors(e.parameter.query || '');
      case 'get-categories':
        return getCategories();
      default:
        return createErrorResponse('Unknown action: ' + action);
    }
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return createErrorResponse(error.toString());
  }
}

// ========================================
// DONOR SEARCH - Works with existing data
// ========================================

function searchDonors(query) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET_NAME);

    if (!sheet) {
      return createErrorResponse('Inventory sheet not found: ' + INVENTORY_SHEET_NAME);
    }

    const data = sheet.getDataRange().getValues();
    const donors = [];
    const donorMap = {}; // Use map to avoid duplicates

    // Skip header row, iterate through all rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Extract name and email from existing columns
      const name = row[EXISTING_DATA_COLUMNS.NAME] ? row[EXISTING_DATA_COLUMNS.NAME].toString().trim() : '';
      const email = row[EXISTING_DATA_COLUMNS.EMAIL] ? row[EXISTING_DATA_COLUMNS.EMAIL].toString().trim() : '';

      // Try to extract housing and grad year if they exist in your old data
      // Adjust these indices based on your actual column positions
      const housing = row[3] ? row[3].toString().trim() : '';  // Column D
      const gradYear = row[4] ? row[4].toString().trim() : ''; // Column E

      // Skip empty rows
      if (!name && !email) continue;

      // Check if matches query
      const lowerQuery = query.toLowerCase();
      const nameMatch = name.toLowerCase().includes(lowerQuery);
      const emailMatch = email.toLowerCase().includes(lowerQuery);

      if (nameMatch || emailMatch || query === '') {
        // Use email as key to avoid duplicates
        const key = email || name; // Use email as key, or name if no email
        if (!donorMap[key]) {
          donorMap[key] = {
            name: name,
            email: email,
            housing: housing,     // Will be empty for old data
            gradYear: gradYear    // Will be empty for old data
          };
        }
      }
    }

    // Convert map to array
    for (let key in donorMap) {
      donors.push(donorMap[key]);
    }

    // Limit to 20 results
    const limitedDonors = donors.slice(0, 20);

    return ContentService.createTextOutput(JSON.stringify(limitedDonors))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('searchDonors error: ' + error.toString());
    return createErrorResponse(error.toString());
  }
}

// ========================================
// CATEGORIES
// ========================================

function getCategories() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CATEGORIES_SHEET_NAME);

    if (!sheet) {
      // If Categories sheet doesn't exist, return empty array
      // This allows the app to still work without it
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const categories = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (row[0]) { // If category name exists
        categories.push({
          name: row[0].toString(),
          timesUsed: row[1] || 0,
          createdDate: row[2] || '',
          createdBy: row[3] || ''
        });
      }
    }

    // Sort by usage count (descending)
    categories.sort((a, b) => b.timesUsed - a.timesUsed);

    return ContentService.createTextOutput(JSON.stringify(categories))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('getCategories error: ' + error.toString());
    return createErrorResponse(error.toString());
  }
}

function createCategory(categoryName, workerEmail) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CATEGORIES_SHEET_NAME);

    if (!sheet) {
      return createErrorResponse('Categories sheet not found. Please create it first.');
    }

    // Check for duplicates (case-insensitive)
    const data = sheet.getDataRange().getValues();
    const lowerCategoryName = categoryName.toLowerCase().trim();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().toLowerCase() === lowerCategoryName) {
        return createErrorResponse('Category already exists');
      }
    }

    // Add new category
    sheet.appendRow([
      categoryName.trim(),
      0,
      new Date(),
      workerEmail || 'unknown'
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      category: {
        name: categoryName.trim(),
        timesUsed: 0
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('createCategory error: ' + error.toString());
    return createErrorResponse(error.toString());
  }
}

// ========================================
// PHOTO UPLOAD
// ========================================

function uploadPhoto(base64Data, filename) {
  try {
    if (PHOTO_FOLDER_ID === 'YOUR_FOLDER_ID_HERE') {
      return createErrorResponse('Photo folder not configured. Please set PHOTO_FOLDER_ID in the script.');
    }

    const folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);

    // Remove data URL prefix if present
    const base64Content = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data;

    // Decode base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Content),
      'image/jpeg',
      filename || 'photo_' + new Date().getTime() + '.jpg'
    );

    // Create file in Drive
    const file = folder.createFile(blob);

    // Set sharing to anyone with link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      url: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('uploadPhoto error: ' + error.toString());
    return createErrorResponse(error.toString());
  }
}

// ========================================
// PRODUCT SUBMISSION - Enhanced format
// ========================================

function submitProduct(data) {
  try {
    const inventorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET_NAME);
    const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CATEGORIES_SHEET_NAME);

    if (!inventorySheet) {
      return createErrorResponse('Inventory sheet not found: ' + INVENTORY_SHEET_NAME);
    }

    // NEW FORMAT: Append row with ALL enhanced fields
    // This creates the new structure going forward
    inventorySheet.appendRow([
      new Date(),                      // Date
      data.ownerName || '',            // Owner's Name
      data.email || '',                // Email
      data.housingAssignment || '',    // Housing Assignment
      data.graduationYear || '',       // Graduation Year
      data.category || '',             // Category
      data.itemDescription || '',      // Item Description
      data.photoUrl || '',             // Photo URL
      Utilities.getUuid()              // Submission ID
    ]);

    // Increment category usage count (if Categories sheet exists)
    if (categoriesSheet && data.category) {
      const catData = categoriesSheet.getDataRange().getValues();
      for (let i = 1; i < catData.length; i++) {
        if (catData[i][0] === data.category) {
          const currentCount = catData[i][1] || 0;
          categoriesSheet.getRange(i + 1, 2).setValue(currentCount + 1);
          break;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Product logged successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('submitProduct error: ' + error.toString());
    return createErrorResponse(error.toString());
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: message
  })).setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// TEST FUNCTIONS (for debugging)
// ========================================

function testSearchDonors() {
  const result = searchDonors('');
  Logger.log(result.getContent());
}

function testGetCategories() {
  const result = getCategories();
  Logger.log(result.getContent());
}

function testSubmitProduct() {
  const testData = {
    action: 'submit-product',
    ownerName: 'Test User',
    email: 'test@haverford.edu',
    housingAssignment: 'Test Hall',
    graduationYear: '2025',
    category: 'Test Category',
    itemDescription: 'This is a test item for debugging',
    photoUrl: ''
  };

  const result = submitProduct(testData);
  Logger.log(result.getContent());
}
