// ========================================
// ReUSE Store - Google Apps Script Backend
// CONFIGURED FOR: 2025-2026 (RE)use Store Inventory
// READY TO PASTE - ALL CONFIGURATION COMPLETE!
// ========================================

// ✅ CONFIGURATION - ALL SET!
const INVENTORY_SHEET_NAME = '26-27 inventory';
const CATEGORIES_SHEET_NAME = 'Categories';
const PHOTO_FOLDER_ID = '1rKofS8had8dJ8Nn-E2FBcXA4NLK4g_1d'; // ✅ Your folder ID

// Column mapping - Matches your exact spreadsheet structure
const COLUMNS = {
  DATE: 0,           // Column A
  NAME: 1,           // Column B - Owner's Name
  EMAIL: 2,          // Column C - Email
  HOUSING: 3,        // Column D - Housing Assignment
  GRAD_YEAR: 4,      // Column E - Graduation Year
  ITEMS: 5,          // Column F - Items (old format)
  COUNT: 6,          // Column G - # of Items
  NOTES: 7,          // Column H - Notes
  // NEW columns for enhanced data:
  CATEGORY: 8,       // Column I - Category
  DESCRIPTION: 9,    // Column J - Item Description
  PHOTO: 10,         // Column K - Photo URL
  SUBMISSION_ID: 11  // Column L - Submission ID
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
// DONOR SEARCH - Your 30+ existing donors
// ========================================

function searchDonors(query) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET_NAME);

    if (!sheet) {
      return createErrorResponse('Sheet not found: ' + INVENTORY_SHEET_NAME);
    }

    const data = sheet.getDataRange().getValues();
    const donorMap = {};

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      const name = row[COLUMNS.NAME] ? row[COLUMNS.NAME].toString().trim() : '';
      const email = row[COLUMNS.EMAIL] ? row[COLUMNS.EMAIL].toString().trim() : '';
      const housing = row[COLUMNS.HOUSING] ? row[COLUMNS.HOUSING].toString().trim() : '';
      const gradYear = row[COLUMNS.GRAD_YEAR] ? row[COLUMNS.GRAD_YEAR].toString().trim() : '';

      if (!name && !email) continue;

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
      return createErrorResponse('Categories sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    const lowerName = categoryName.toLowerCase().trim();

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
// PRODUCT SUBMISSION
// ========================================

function submitProduct(data) {
  try {
    const inventorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET_NAME);
    const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CATEGORIES_SHEET_NAME);

    if (!inventorySheet) {
      return createErrorResponse('Sheet not found: ' + INVENTORY_SHEET_NAME);
    }

    // Build row - maintains your existing columns + adds new ones
    const newRow = [];
    newRow[COLUMNS.DATE] = new Date();
    newRow[COLUMNS.NAME] = data.ownerName || '';
    newRow[COLUMNS.EMAIL] = data.email || '';
    newRow[COLUMNS.HOUSING] = data.housingAssignment || '';
    newRow[COLUMNS.GRAD_YEAR] = data.graduationYear || '';
    newRow[COLUMNS.ITEMS] = '';
    newRow[COLUMNS.COUNT] = 1;
    newRow[COLUMNS.NOTES] = '';
    newRow[COLUMNS.CATEGORY] = data.category || '';
    newRow[COLUMNS.DESCRIPTION] = data.itemDescription || '';
    newRow[COLUMNS.PHOTO] = data.photoUrl || '';
    newRow[COLUMNS.SUBMISSION_ID] = Utilities.getUuid();

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
  Logger.log('=== Testing Donor Search ===');
  const result = searchDonors('');
  Logger.log(result.getContent());
}

function testGetCategories() {
  Logger.log('=== Testing Categories ===');
  const result = getCategories();
  Logger.log(result.getContent());
}

function testSubmitProduct() {
  Logger.log('=== Testing Product Submission ===');
  const testData = {
    ownerName: 'Test User',
    email: 'test@haverford.edu',
    housingAssignment: 'Test Hall',
    graduationYear: '2025',
    category: 'Furniture',
    itemDescription: 'Test item for debugging',
    photoUrl: ''
  };

  const result = submitProduct(testData);
  Logger.log(result.getContent());
}

// ========================================
// EXTRACT DONORS FROM DRIVE FOLDER
// ========================================

// Configuration: Your Drive folder with donor files
const DONORS_DRIVE_FOLDER_ID = '1hapClr-FtV5bL3xJyxjeWa741yCs648i';

/**
 * Extract donors from Drive folder and add to spreadsheet
 * Run this function once from Apps Script editor: Run → extractDonorsFromDrive
 */
function extractDonorsFromDrive() {
  try {
    const folder = DriveApp.getFolderById(DONORS_DRIVE_FOLDER_ID);
    const files = folder.getFiles();
    const inventorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(INVENTORY_SHEET_NAME);

    if (!inventorySheet) {
      Logger.log('ERROR: Sheet not found: ' + INVENTORY_SHEET_NAME);
      return { success: false, error: 'Sheet not found: ' + INVENTORY_SHEET_NAME };
    }

    const donorsAdded = [];
    const donorsSkipped = [];
    const today = new Date();

    while (files.hasNext()) {
      const file = files.next();
      const owner = file.getOwner();

      if (owner) {
        const name = owner.getName();
        const email = owner.getEmail();

        // Check if already exists
        const data = inventorySheet.getDataRange().getValues();
        let exists = false;
        for (let i = 1; i < data.length; i++) {
          if (data[i][COLUMNS.EMAIL] === email) {
            exists = true;
            donorsSkipped.push({ name, email, reason: 'Already exists' });
            break;
          }
        }

        if (!exists && email) {
          // Add new row
          const newRow = [];
          newRow[COLUMNS.DATE] = today;
          newRow[COLUMNS.NAME] = name;
          newRow[COLUMNS.EMAIL] = email;
          newRow[COLUMNS.HOUSING] = '';
          newRow[COLUMNS.GRAD_YEAR] = '';
          newRow[COLUMNS.ITEMS] = 'Imported from Drive';
          newRow[COLUMNS.COUNT] = 0;
          newRow[COLUMNS.NOTES] = 'File: ' + file.getName();
          newRow[COLUMNS.CATEGORY] = '';
          newRow[COLUMNS.DESCRIPTION] = '';
          newRow[COLUMNS.PHOTO] = file.getUrl();
          newRow[COLUMNS.SUBMISSION_ID] = Utilities.getUuid();

          inventorySheet.appendRow(newRow);
          donorsAdded.push({ name, email, fileName: file.getName() });
        }
      }
    }

    Logger.log('=== EXTRACTION COMPLETE ===');
    Logger.log('Donors added: ' + donorsAdded.length);
    Logger.log('Donors skipped: ' + donorsSkipped.length);
    Logger.log('\nAdded:');
    Logger.log(JSON.stringify(donorsAdded, null, 2));
    Logger.log('\nSkipped:');
    Logger.log(JSON.stringify(donorsSkipped, null, 2));

    return {
      success: true,
      count: donorsAdded.length,
      skipped: donorsSkipped.length,
      donors: donorsAdded
    };

  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Test function - see how many files are in the folder
 */
function testCountDriveFiles() {
  try {
    const folder = DriveApp.getFolderById(DONORS_DRIVE_FOLDER_ID);
    const files = folder.getFiles();

    let count = 0;
    const fileList = [];

    while (files.hasNext()) {
      const file = files.next();
      const owner = file.getOwner();
      count++;
      fileList.push({
        name: file.getName(),
        owner: owner ? owner.getName() : 'Unknown',
        email: owner ? owner.getEmail() : 'Unknown'
      });
    }

    Logger.log('=== DRIVE FOLDER CONTENTS ===');
    Logger.log('Total files: ' + count);
    Logger.log('\nFiles:');
    Logger.log(JSON.stringify(fileList, null, 2));

    return { success: true, count: count, files: fileList };

  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}
