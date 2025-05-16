//Search In Sheet: All Contacts
function searchContactByPhoneNumber(phoneNumberInput) {
  const phoneNumbers = allContactsSheet.getRange("A2:A").getValues(); // All phone numbers in column A
  const names = allContactsSheet.getRange("B2:B").getValues(); // Corresponding names in column B
  
  // Normalize the input phone number (remove non-numeric characters)
  const normalizedInput = normalizePhoneNumber(phoneNumberInput);
  
  // Build a hashmap (object) to store the contacts
  let contactMap = buildContactMap(phoneNumbers, names);

  // Try to find an exact match first in the hashmap
  if (normalizedInput in contactMap) {
    return contactMap[normalizedInput]; // Return the name if an exact match is found
  }
  
  // If no exact match is found, fallback to a linear search for substring matching
  for (let phone in contactMap) {
    if (phone.includes(normalizedInput) || normalizedInput.includes(phone)) {
      return contactMap[phone]; // Return the corresponding name for partial match
    }
  }
  
  return "NA";
}

// Helper function to build a hashmap from phone numbers and names
function buildContactMap(phoneNumbers, names) {
  let contactMap = {};
  
  for (let i = 0; i < phoneNumbers.length; i++) {
    const normalizedPhone = normalizePhoneNumber(phoneNumbers[i][0]); // Normalize sheet phone number
    if (normalizedPhone) {
      contactMap[normalizedPhone] = names[i][0]; // Map normalized phone number to the corresponding name
    }
  }
  
  return contactMap;
}

// Helper function to normalize phone numbers by removing non-numeric characters
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";
  return phoneNumber.toString().replace(/\D/g, ""); // Removes anything that's not a digit
}

function searchValues(range, value1, value2) {
  var values = range.getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === value1 && values[i][1] === value2) {
      return i + 1; // Return the row number (1-indexed)
    }
  }
  return -1; // Return -1 if not found
}