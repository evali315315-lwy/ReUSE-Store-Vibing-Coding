// ========================================
// ReUSE Store - Google Apps Script Backend
// ========================================
// This script acts as a middleware between the web app and Google Sheets
// Deploy as: Web App (Anyone, even anonymous can access)

// CONFIGURATION - UPDATE THESE VALUES
const INVENTORY_SHEET_NAME = 'Inventory Log'; // Change if your sheet has a different name
const CATEGORIES_SHEET_NAME = 'Categories';
const PHOTO_FOLDER_ID = 'YOUR_FOLDER_ID_HERE'; // Replace with your Google Drive folder ID

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
// DONOR SEARCH
// ========================================

function searchDonors(query) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET_NAME);

    if (!sheet) {
      return createErrorResponse('Inventory sheet not found: ' + INVENTORY_SHEET_NAME);
    }

    const data = sheet.getDataRange().getValues();
    const donors = [];
    const donorMap = {}; // Use map to avoid duplicates by email

    // Skip header row (row 0), iterate through data
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Extract data based on column positions
      // Adjust indices if your columns are in different order
      const date = row[0];
      const name = row[1] ? row[1].toString().trim() : '';
      const email = row[2] ? row[2].toString().trim() : '';
      const housing = row[3] ? row[3].toString().trim() : '';
      const gradYear = row[4] ? row[4].toString().trim() : '';

      // Skip empty rows
      if (!name && !email) continue;

      // Check if matches query
      const lowerQuery = query.toLowerCase();
      const nameMatch = name.toLowerCase().includes(lowerQuery);
      const emailMatch = email.toLowerCase().includes(lowerQuery);

      if (nameMatch || emailMatch || query === '') {
        // Use email as key to avoid duplicates
        if (email && !donorMap[email]) {
          donorMap[email] = {
            name: name,
            email: email,
            housing: housing,
            gradYear: gradYear
          };
        }
      }
    }

    // Convert map to array
    for (let email in donorMap) {
      donors.push(donorMap[email]);
    }

    // Limit to 20 results for performance
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
      return createErrorResponse('Categories sheet not found: ' + CATEGORIES_SHEET_NAME);
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
      return createErrorResponse('Categories sheet not found: ' + CATEGORIES_SHEET_NAME);
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
    const folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);

    // Remove data URL prefix if present (data:image/jpeg;base64,)
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
// PRODUCT SUBMISSION
// ========================================

function submitProduct(data) {
  try {
    const inventorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET_NAME);
    const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CATEGORIES_SHEET_NAME);

    if (!inventorySheet) {
      return createErrorResponse('Inventory sheet not found: ' + INVENTORY_SHEET_NAME);
    }

    // Append to inventory
    inventorySheet.appendRow([
      new Date(),
      data.ownerName || '',
      data.email || '',
      data.housingAssignment || '',
      data.graduationYear || '',
      data.category || '',
      data.itemDescription || '',
      data.photoUrl || '',
      Utilities.getUuid()
    ]);

    // Increment category usage count
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
// TEST FUNCTION (for debugging)
// ========================================

function testSearchDonors() {
  const result = searchDonors('john');
  Logger.log(result.getContent());
}

function testGetCategories() {
  const result = getCategories();
  Logger.log(result.getContent());
}
