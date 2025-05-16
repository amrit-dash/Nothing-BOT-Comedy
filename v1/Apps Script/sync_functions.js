// Functions For Daily Sync of All Contacts
// Main sync function that handles the contact synchronization
function syncContacts() {
  
  allContactsSheet.clearContents(); // Clear the sheet before updating
  allContactsSheet.appendRow(['Phone Number', 'Name']); // Add headers to the sheet

  try {
    const syncToken = PropertiesService.getScriptProperties().getProperty('syncToken');
    const contacts = getAllContacts(syncToken); // Get all contacts, handle pagination

    // Write contacts to Google Sheets
    updateSheetWithContacts(allContactsSheet, contacts);

    // Update the sync token if available
    const newSyncToken = contacts.nextSyncToken;
    if (newSyncToken) {
      PropertiesService.getScriptProperties().setProperty('syncToken', newSyncToken);
    }
    
  } catch (err) {
    if (err.message.includes('EXPIRED_SYNC_TOKEN')) {
      // Handle expired sync token
      PropertiesService.getScriptProperties().deleteProperty('syncToken');
      Logger.log('Sync token expired, resetting token and performing full sync.');
      syncContacts(); // Retry sync without token
    } else {
      Logger.log('Failed to sync contacts with error: %s', err.message);
    }
  }
}

// Function to handle pagination and retrieve all contacts
function getAllContacts(syncToken) {
  let pageToken, response;
  const allContacts = [];
  const requestParams = {
    personFields: 'names,phoneNumbers',
    pageSize: 1000,
    requestSyncToken: false
  };
  
  if (syncToken) {
    requestParams.syncToken = syncToken;
  }

  do {
    const response = People.People.Connections.list('people/me', requestParams);
    if (response.connections) {
      allContacts.push(...response.connections); // Add fetched contacts to array
    }
    pageToken = response.nextPageToken; // Handle pagination
    requestParams.pageToken = pageToken; // Update page token for next iteration
  } while (pageToken);

  return {
    connections: allContacts
    //nextSyncToken: response.nextSyncToken // Return next sync token for further sync
  };
}

// Function to write contacts to Google Sheets in the desired format
function updateSheetWithContacts(sheet, contacts) {
  var rows = [];

  contacts.connections.forEach(contact => {
    const name = contact.names ? contact.names[0].displayName : 'No Name'; // Default name
    const phoneNumbers = contact.phoneNumbers ? contact.phoneNumbers.map(pn => (pn.canonicalForm) ? pn.canonicalForm : pn.value) : [];

    phoneNumbers.forEach(phone => {
      rows.push([phone, name]); // Add new row for each phone number with the same name
    });
  });

  rows = removeDuplicatePhoneNumbers(rows);

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 2).setValues(rows);
  }
}

function removeDuplicatePhoneNumbers(data) {
  // Create a Set to track unique phone numbers
  const phoneSet = new Set();
  
  // Filter the array based on unique phone numbers
  const filteredData = data.filter(function(row) {
    const phoneNumber = row[0]; // Phone number is in the first column
    if (phoneSet.has(phoneNumber)) {
      return false; // Duplicate found, filter out this row
    }
    phoneSet.add(phoneNumber); // Add unique phone number to the set
    return true; // Keep this row
  });

  return filteredData;
}