function findContact(value, attribute) {
  if (attribute === "phone") {
    var query = parseInt(value);

  } else if (attribute === "name") {
    var query = value;
  }


  People.People.searchContacts({
    query: '',
    readMask: 'names,phoneNumbers'
  });

  Utilities.sleep(300);


  var matchedContact = People.People.searchContacts({
    query: query,
    readMask: 'names,phoneNumbers'
  });

  if (matchedContact.results) {
    console.log("Contact Found");
    var name = matchedContact.results[0].person.names[0].displayName;
    var numbers = matchedContact.results[0].person.phoneNumbers[0];
    var number = (numbers.canonicalForm) ? numbers.canonicalForm : numbers.value;

    return [name, number];

  } else {
    console.log("Contact Not Found!");
    return "NA"
  }
}

function createContact(firstName, lastName, number, wpProfileName) {
  try {
    // Define the contact details
    var contact = {
      'names': [
        {
          'givenName': firstName,
          'familyName': lastName
        }
      ],
      'nicknames': [
        {
          'value': wpProfileName
        }
      ],
      'phoneNumbers': [
        {
          'value': number,
          'type': 'mobile'
        }
      ]
    };

    // Create the contact
    var response = People.People.createContact(contact);
    console.log('Contact created: %s', JSON.stringify(response, null, 2));

    return 1;
  } catch (err) {
    console.log('Failed to create contact with error %s', err.message);

    return err;
  }
}

function saveNewContact(details) {
  var firstName = details.name;
  var number = details.number;
  var scene = (details.scene) ? details.scene : "BLR";
  var time = (details.timeInComedy) ? details.timeInComedy : details.travellingComicTime;
  var whatsappProfileName = (details.waProfileName) ? details.waProfileName : "NA";

  var timeValue = parseInt(time);

  if (time.toLowerCase().includes("year") && timeValue >= 1) {
    var lastName = `Comic ${scene}`;
  } else {
    var lastName = `Comic ${scene} - New`;
  }

  var newContactNextRow = getLastDataRow(newContactsSheet) + 1;
  newContactsSheet.getRange(`A${newContactNextRow}:E${newContactNextRow}`).setValues([[`${firstName} ${lastName}`, number, whatsappProfileName, scene, time]]).setBorder(true, true, true, true, true, true);


  var saveContact = createContact(firstName, lastName, number, whatsappProfileName);

  if (saveContact == 1) {
    updateRemarks(details.pingRowNumber, "Contact Saved");
  } else {
    updateRemarks(details.pingRowNumber, `Error Saving Contact.\nError: ${saveContact.message}`);
  }
}

function updateBlankComicContact() {
  var activeSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (activeSheet.getSheetName().includes("Spot Allocation -") || activeSheet.getSheetName() === "Spot Requests") {
    var sheet = activeSheet;
  } else {
    return;
  }

  var lastDataRow = getLastDataRow(sheet);

  for (let i = 2; i <= lastDataRow; i++) {
    var comicName = sheet.getRange(`A${i}`);
    var phoneNumber = sheet.getRange(`B${i}`);
    var searchValue, searchParam;

    //console.log(comicName.getValue());

    if (comicName.getValue().toString().includes("whatsapp")) {
      searchValue = phoneNumber.getValue();
      searchParam = "phone";
    } else if (phoneNumber.isBlank()) {
      searchValue = comicName.getValue();
      searchParam = "name";
    } else {
      continue;
    }

    var comic = findContact(searchValue, searchParam);

    if (comic === "NA") {
      console.log("Could not find any contact named: " + comicName.getValue());
    } else {
      sheet.getRange(`A${i}:B${i}`).setValues([comic]);
    }
  }
}