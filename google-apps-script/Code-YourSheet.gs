// ========================================
// ReUSE Store - Google Apps Script Backend
// CONFIGURED FOR: 2025-2026 (RE)use Store Inventory
// ========================================

// CONFIGURATION - UPDATE ONLY THE FOLDER ID
const INVENTORY_SHEET_NAME = '2025-2026 Inventory'; // Main sheet tab name
const CATEGORIES_SHEET_NAME = 'Categories';
const PHOTO_FOLDER_ID = 'YOUR_FOLDER_ID_HERE'; // ← REPLACE THIS

// Column mapping for YOUR spreadsheet
// Current structure: Date | Owner's Name | Email | Housing | Grad Year | Items | # Items | Notes
const COLUMNS = {
  DATE: 0,           // Column A
  NAME: 1,           // Column B - Owner's Name
  EMAIL: 2,          // Column C - Email
  HOUSING: 3,        // Column D - Housing Assignment
  GRAD_YEAR: 4,      // Column E - Graduation Year
  ITEMS: 5,          // Column F - Items (old format)
  COUNT: 6,          // Column G - # of Items
  NOTES: 7,          // Column H - Notes

  // NEW columns that will be added for enhanced submissions:
  CATEGORY: 8,       // Column I - Category (NEW)
  DESCRIPTION: 9,    // Column J - Item Description (NEW)
  PHOTO: 10,         // Column K - Photo URL (NEW)
  SUBMISSION_ID: 11  // Column L - Submission ID (NEW)
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
// DONOR SEARCH - Your existing data
// ========================================

function searchDonors(query) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET_NAME);

    if (!sheet) {
      return createErrorResponse('Sheet not found: ' + INVENTORY_SHEET_NAME);
    }

    const data = sheet.getDataRange().getValues();
    const donorMap = {}; // Deduplicate by email

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      const name = row[COLUMNS.NAME] ? row[COLUMNS.NAME].toString().trim() : '';
      const email = row[COLUMNS.EMAIL] ? row[COLUMNS.EMAIL].toString().trim() : '';
      const housing = row[COLUMNS.HOUSING] ? row[COLUMNS.HOUSING].toString().trim() : '';
      const gradYear = row[COLUMNS.GRAD_YEAR] ? row[COLUMNS.GRAD_YEAR].toString().trim() : '';

      // Skip empty rows
      if (!name && !email) continue;

      // Search filter
      const lowerQuery = query.toLowerCase();
      const nameMatch = name.toLowerCase().includes(lowerQuery);
      const emailMatch = email.toLowerCase().includes(lowerQuery);

      if (query === '' || nameMatch || emailMatch) {
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

    // Convert to array
    const donors = Object.values(donorMap).slice(0, 20);

    return ContentService.createTextOutput(JSON.stringify(donors))
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
      // Return empty if sheet doesn't exist yet
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const categories = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        categories.push({
          name: data[i][0].toString(),
          timesUsed: data[i][1] || 0,
          createdDate: data[i][2] || '',
          createdBy: data[i][3] || ''
        });
      }
    }

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

    const data = sheet.getDataRange().getValues();
    const lowerName = categoryName.toLowerCase().trim();

    // Check duplicates
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().toLowerCase() === lowerName) {
        return createErrorResponse('Category already exists');
      }
    }

    sheet.appendRow([categoryName.trim(), 0, new Date(), workerEmail || 'unknown']);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      category: { name: categoryName.trim(), timesUsed: 0 }
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
      return createErrorResponse('Photo folder not configured');
    }

    const folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
    const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Content),
      'image/jpeg',
      filename || 'photo_' + new Date().getTime() + '.jpg'
    );

    const file = folder.createFile(blob);
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
      return createErrorResponse('Sheet not found: ' + INVENTORY_SHEET_NAME);
    }

    // Build row with EXTENDED columns
    // Columns A-H match your existing structure
    // Columns I-L are NEW enhanced fields
    const newRow = [];
    newRow[COLUMNS.DATE] = new Date();
    newRow[COLUMNS.NAME] = data.ownerName || '';
    newRow[COLUMNS.EMAIL] = data.email || '';
    newRow[COLUMNS.HOUSING] = data.housingAssignment || '';
    newRow[COLUMNS.GRAD_YEAR] = data.graduationYear || '';
    newRow[COLUMNS.ITEMS] = ''; // Old items field - leave empty for new format
    newRow[COLUMNS.COUNT] = 1;  // Default to 1 item
    newRow[COLUMNS.NOTES] = ''; // Empty for now
    newRow[COLUMNS.CATEGORY] = data.category || '';        // NEW
    newRow[COLUMNS.DESCRIPTION] = data.itemDescription || ''; // NEW
    newRow[COLUMNS.PHOTO] = data.photoUrl || '';           // NEW
    newRow[COLUMNS.SUBMISSION_ID] = Utilities.getUuid();   // NEW

    inventorySheet.appendRow(newRow);

    // Increment category count
    if (categoriesSheet && data.category) {
      const catData = categoriesSheet.getDataRange().getValues();
      for (let i = 1; i < catData.length; i++) {
        if (catData[i][0] === data.category) {
          categoriesSheet.getRange(i + 1, 2).setValue((catData[i][1] || 0) + 1);
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
// HELPERS
// ========================================

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: message
  })).setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// TEST FUNCTIONS
// ========================================

function testSearchDonors() {
  Logger.log('Testing donor search...');
  const result = searchDonors('');
  Logger.log(result.getContent());
}

function testGetCategories() {
  Logger.log('Testing categories...');
  const result = getCategories();
  Logger.log(result.getContent());
}
