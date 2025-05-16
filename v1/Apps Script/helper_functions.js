var currentWeekSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Current Week");
var midWeekRequestsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Ad-Hoc Requests - Mid Week Pings");
var spotRequestPingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Spot Requests");
var allPingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("All Pings");
var spotHistorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Spot History");
var newContactsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("New Contacts");
var allContactsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("All Contacts");

var spotAllocationTemplateSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Spot Allocation - Template");
var spotAllocationCurrentWeekSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Spot Allocation - Next Week");
var spotAllocationLastWeekSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Spot Allocation - Last Week");

var mySpotsSheetTemplate = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Amrit's Spots - Template");
var mySpotsSheetThisWeek = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Amrit's Spots - This Week");
var mySpotsSheetLastWeek = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Amrit's Spots - Last Week");

var currentWeek8PMRange = spotAllocationCurrentWeekSheet.getRange("G2:K8");
var currentWeek10PMRange = spotAllocationCurrentWeekSheet.getRange("G11:K17");

var whatsapp8PMGroupLink = "https://chat.whatsapp.com/LMCS6ZlODOJJiGk4VCbbko";
var whatsapp10PMGroupLink = "https://chat.whatsapp.com/JBAZBNGVFFEAUDYnhSoX6s";

var whapi_token = PropertiesService.getScriptProperties().getProperty("whapiToken");
var weekday10PMGroupID = "120363253778472424@g.us";
var weekday8PMGroupID = "120363330097890268@g.us";
var punchlimeClubGroupID = "120363207307086928@g.us";
var weekdayPOCsGroupID = "120363345303800345@g.us";

var overrideMidWeekRequestValue = (PropertiesService.getScriptProperties().getProperty("allowMidWeek")) ? PropertiesService.getScriptProperties().getProperty("allowMidWeek") : "NO";
var overrideLastWeekRequestValue = (PropertiesService.getScriptProperties().getProperty("allowLastWeek")) ? PropertiesService.getScriptProperties().getProperty("allowLastWeek") : "NO";

function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('🎤 Spot Management Menu')
    .addItem('Complete Curation', 'completeCuration')
    .addItem('Update Lineups For MON', 'updateMONlineup')
    .addSeparator()
    .addSubMenu(
      ui.createMenu("Ad-Hoc Management")
        .addItem('Give Ad-Hoc Spot', 'giveAdHocSpot')
        .addItem('Post Lineup To Group', 'postLineupToGroupManual')
        .addSeparator()
        .addItem('Sync Contacts', 'syncContacts')
        .addItem('Update Blank Contact Row', 'updateBlankComicContact')
        .addSeparator()
        .addItem('Send Weekday Poll For Punchlime Admins', 'sendAdminPollsToWeekdayGroups')
        .addItem('Update Both Polls', 'updatePolls')
        .addItem('Check If Mic Happened', 'micCheck')
        .addSeparator()
        .addItem('Add Today\'s Comics To Weekday Groups', 'addTodaysComicsToWeekdayGroups')
        .addItem('Remove Non-Admin Comics From Weekday Groups', 'removeNonAdminComicsFromWeekdayGroups')
        .addSeparator()
        .addSubMenu(
          ui.createMenu("Change Spot Request Parameters")
            .addItem('Allow Mid-Week Spot Request', 'allowMidWeekRequests')
            .addItem('Stop Mid-Week Spot Request', 'stopMidWeekRequests')
            .addSeparator()
            .addItem('Allow Last-Week Spot Request', 'allowLastWeekRequests')
            .addItem('Stop Last-Week Spot Request', 'stopLastWeekRequests')
        )
    )
    .addSeparator()
    .addItem('Send Message From Bot', 'sendCustomMessage')
    .addToUi();

  ui.createMenu('🛠️ Custom Options Menu')
    .addItem('Start Spot Allocation', 'startSpotAllocation')
    .addItem('Clear All Pings Sheet', 'cleanupAllPingsSheet')
    .addItem('Clear Spot Request Sheet', 'cleanupSpotRequestsSheet')
    .addItem('Archive All Ping Rows', 'archiveAllPingRequests')
    .addSeparator()
    .addItem('Pretty Print Lineup', 'shiftLineups')
    .addToUi();

}

function createJsonOutput(pingDetails) {

  var data = {
    "reasonCode": pingDetails.reasonCode,
    "fullName": pingDetails.contactName,
    "firstName": pingDetails.firstName,
    "newPingRowNumber": (pingDetails.pingRowNumber) ? pingDetails.pingRowNumber : "NA",
    "spotRequestRowNumber": (pingDetails.spotRequestRowNumber) ? pingDetails.spotRequestRowNumber : "NA",
    "spotAllocationRowNumber": (pingDetails.spotAllocationRowNumber) ? pingDetails.spotAllocationRowNumber : "NA",
    "statusCode": pingDetails.statusCode,
    "message": pingDetails.body,
    "customResponse": (pingDetails.customResponse) ? pingDetails.customResponse : "NA",
    "formattedNumber": pingDetails.formattedNumber
  };

  var jsonOutput = ContentService.createTextOutput(JSON.stringify(data));
  jsonOutput.setMimeType(ContentService.MimeType.JSON);

  return jsonOutput;
}

function getLastDataRow(sheet, column = "A") {
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange(column + lastRow);

  if (range.isBlank() || (range.isChecked() == false)) {
    return range.getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
  } else {
    return lastRow;
  }
}

function updateRemarks(rowNumber, remark, notes = "NA") {
  var allPingsRemarkCell = allPingsSheet.getRange(`D${rowNumber}`);

  allPingsRemarkCell.setValue(remark);

  if (notes !== "NA") {
    allPingsRemarkCell.setNote(notes);
  }
}

function getLastOccurrenceOfDay(day) {
  // Mapping of day names to their corresponding numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const daysMap = {
    "SUN": 0,
    "MON": 1,
    "TUE": 2,
    "WED": 3,
    "THU": 4,
    "FRI": 5,
    "SAT": 6
  };

  // Get the current date and day index
  const today = new Date();
  const currentDayIndex = today.getDay();

  // Get the target day index from the input day
  const targetDayIndex = daysMap[day.toUpperCase()];

  if (targetDayIndex === undefined) {
    throw new Error("Invalid day input. Please use 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', or 'SAT'.");
  }

  // Calculate the difference between the current day and target day
  let daysDifference = currentDayIndex - targetDayIndex;

  // Adjust for cases where the target day is ahead in the current week (i.e., the previous week's day)
  if (daysDifference < 0) {
    daysDifference += 7;
  }

  // Calculate the date of the last occurrence of the given day
  const lastOccurrenceDate = new Date(today);
  lastOccurrenceDate.setDate(today.getDate() - daysDifference);

  // Return the date in "YYYY-MM-DD" format
  return Utilities.formatDate(lastOccurrenceDate, Session.getScriptTimeZone(), "EEEE, dd MMM yyyy");
}

function getNextOccurrenceOfDay(day) {
  // Mapping of day names to their corresponding numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const daysMap = {
    "SUN": 0,
    "MON": 1,
    "TUE": 2,
    "WED": 3,
    "THU": 4,
    "FRI": 5,
    "SAT": 6
  };

  // Get the current date and day index
  const today = new Date();
  const currentDayIndex = today.getDay();

  // Get the target day index from the input day
  const targetDayIndex = daysMap[day.toUpperCase()];

  if (targetDayIndex === undefined) {
    throw new Error("Invalid day input. Please use 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', or 'SAT'.");
  }

  // Calculate the difference between the current day and target day
  let daysDifference = currentDayIndex - targetDayIndex;

  // Adjust for cases where the target day is ahead in the current week (i.e., the previous week's day)
  if (daysDifference < 0) {
    daysDifference += 7;
  }

  // Calculate the date of the last occurrence of the given day
  const lastOccurrenceDate = new Date(today);
  lastOccurrenceDate.setDate(today.getDate() - daysDifference);

  // Return the date in "YYYY-MM-DD" format
  return Utilities.formatDate(lastOccurrenceDate, Session.getScriptTimeZone(), "EEEE, dd MMM yyyy");
}

function getOccurrenceOfDay(day, type = 'last') {
  // Mapping of day names to their corresponding numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const daysMap = {
    "SUN": 0,
    "MON": 1,
    "TUE": 2,
    "WED": 3,
    "THU": 4,
    "FRI": 5,
    "SAT": 6
  };

  // Get the current date and day index
  const today = new Date();
  const currentDayIndex = today.getDay();

  // Get the target day index from the input day
  const targetDayIndex = daysMap[day.toUpperCase()];

  if (targetDayIndex === undefined) {
    throw new Error("Invalid day input. Please use 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', or 'SAT'.");
  }

  // Calculate the difference between the current day and target day
  let daysDifference = targetDayIndex - currentDayIndex;

  if (type === 'next') {
    // If 'next' and the target day is today or earlier in the week, look to next week
    if (daysDifference <= 0) {
      daysDifference += 7;
    }
  } else if (type === 'last') {
    // If 'last' and the target day is ahead in the week, look to the previous week's day
    if (daysDifference > 0) {
      daysDifference -= 7;
    }
  } else {
    throw new Error("Invalid type input. Please use 'next' or 'last'.");
  }

  // Calculate the date of the desired occurrence of the given day
  const occurrenceDate = new Date(today);
  occurrenceDate.setDate(today.getDate() + daysDifference);

  // Return the date in "YYYY-MM-DD" format
  return Utilities.formatDate(occurrenceDate, Session.getScriptTimeZone(), "EEEE, dd MMM yyyy");
}

function findAndDelValueInRange(range, value) {
  // Get all values from the specified range
  const values = range.getValues();

  // Loop through the 2D array to find the search value
  for (let row = 0; row < values.length; row++) {
    for (let col = 0; col < values[row].length; col++) {
      if (values[row][col] === value) {
        range.getCell(row + 1, col + 1).clearContent();
      }
    }
  }

  shiftDataUp(range);
}

function findAndChangeValueInRange(range, oldValue, newValue) {
  // Get all values from the specified range
  const values = range.getValues();

  // Loop through the 2D array to find the search value
  for (let row = 0; row < values.length; row++) {
    for (let col = 0; col < values[row].length; col++) {
      if (values[row][col] === oldValue) {
        range.getCell(row + 1, col + 1).setValue(newValue);
      }
    }
  }
}

function findAndChangeValueBasedOnCriteria(range, criteriaValue, oldValue, newValue) {
  // Get all values from the specified 2-column range
  const values = range.getValues();

  // Loop through the rows and change values in the first column based on the second column
  for (let row = 0; row < values.length; row++) {
    // If the second column matches the criteriaValue
    if (values[row][0] === oldValue && values[row][1] === criteriaValue) {
      // Update the first column's value
      values[row][0] = newValue;
      values[row][1] = "";
    }
  }

  // Write the updated values back to the range in one go
  range.setValues(values);
}

function fillInNextBlank(day, time, name, editedSheet) {

  // Get the target column based on the selected day
  var targetColumn = dayColumnMapping[day];

  // If a valid day is selected
  if (targetColumn) {
    var found = 0;

    if (time === "8:00 PM") {
      // Find the next blank cell in the target column (from row 2 to row 8)
      for (var row = 2; row <= 8; row++) {
        var cell = editedSheet.getRange(row, targetColumn);
        if (cell.getValue() === "" || cell.getValue() === "-") {
          cell.setValue(name); // Place the name in the next blank cell
          found = 1;
          break; // Stop once the first blank cell is found
        }
      }
      return found;
    } else if (time === "10:00 PM") {
      // Find the next blank cell in the target column (from row 11 to row 17)
      for (var row = 11; row <= 17; row++) {
        var cell = editedSheet.getRange(row, targetColumn);
        if (cell.getValue() === "" || cell.getValue() === "-") {
          cell.setValue(name); // Place the name in the next blank cell
          found = 1;
          break; // Stop once the first blank cell is found
        }
      }
      return found;
    }
  }

}

function shiftLineups() {
  shiftDataUp(currentWeek8PMRange);
  shiftDataUp(currentWeek10PMRange);
}

function shiftDataUp(range) {
  // Get the values from the specified range
  var values = range.getValues();
  var numRows = values.length;
  var numCols = values[0].length;

  // Loop through each column in the range
  for (var col = 0; col < numCols; col++) {
    var nonEmptyData = [];

    // Collect non-empty values in the current column
    for (var row = 0; row < numRows; row++) {
      if (values[row][col] !== "") {
        nonEmptyData.push(values[row][col]); // Collect non-blank cells
      }
    }

    // Fill the column with non-empty data and the rest with blanks
    for (var row = 0; row < numRows; row++) {
      if (row < nonEmptyData.length) {
        values[row][col] = nonEmptyData[row]; // Shift data up
      } else {
        values[row][col] = ""; // Fill remaining cells with blanks
      }
    }
  }

  // Write the updated 2D array back to the range
  range.setValues(values);
}

function cleanupSpotRequestsSheet() {
  spotRequestPingsSheet.getRange("A2:I").clearContent().removeCheckboxes();
}

function cleanupAllPingsSheet() {
  allPingsSheet.getRange("A2:E").clearContent().clearNote();
}

function cleanupMidWeekSpotsSheet() {
  midWeekRequestsSheet.getRange("A2:D").clearContent();
}

function archiveAllPingRequests() {
  var lastRow = getLastDataRow(allPingsSheet);
  allPingsSheet.hideRows(2, lastRow - 1);
}

function updateNotificationCheckbox(name, number, currentWeekRowNumber, spotDay, isCheck) {
  var spotRequestSheetLastRow = getLastDataRow(spotRequestPingsSheet);
  var spotRequestSheetRowNumber = searchValues(spotRequestPingsSheet.getRange(`A2:H${spotRequestSheetLastRow}`), name, number) + 1;

  if (spotDay.getValue() === "CANNED" || spotRequestSheetRowNumber == 0) {
    return;
  }

  var spotDayCell = spotRequestPingsSheet.getRange(`G${spotRequestSheetRowNumber}`);
  if (spotDayCell.getFormula() === "") {
    spotDayCell.setFormula(`='${spotAllocationCurrentWeekSheet.getSheetName()}'!C${currentWeekRowNumber}`);
  }

  var notificationCell = spotRequestPingsSheet.getRange(`I${spotRequestSheetRowNumber}`);

  (notificationCell.isBlank()) ? notificationCell.insertCheckboxes() : ((isCheck == 0) ? notificationCell.uncheck() : notificationCell.check());
}

// Select phone number function to simplify number selection logic
function selectPhoneNumber(phones, ui) {
  if (phones.length === 1) {
    return `whatsapp:${phones[0]}`;
  }

  var numberSelector = ui.prompt("Select the Phone Number:", `Enter 1 for first number, 2 for second, and so on.\n\n${phones.join("\n")}`, ui.ButtonSet.OK).getResponseText();
  var index = parseInt(numberSelector) - 1;

  if (index >= 0 && index < phones.length) {
    return `whatsapp:${phones[index]}`;
  }

  return null; // Invalid selection
}

// Validate day input
function validateDay(daySelector, validDayChoices) {
  var lowerCaseChoices = validDayChoices.join(" ").toLowerCase();
  return lowerCaseChoices.includes(daySelector.toLowerCase()) ? daySelector.substring(0, 3).toUpperCase() : null;
}

// Validate time input
function validateTime(timeSelector, validTimeChoices) {
  return validTimeChoices.includes(timeSelector) ? parseInt(timeSelector) : null;
}

// Get day parameters based on day selection
function getDayParameters(dayCode, today) {
  var parameters = {};
  var date = getOccurrenceOfDay(dayCode, "next");

  if (dayCode === today) {
    parameters.day = "Today";
  } else {
    parameters.day = date;
  }

  return parameters;
}

// v2 Function
function postTodaysLineup(dayCode, time, sendBMSLink = 0, sendLineup = 1, sendPOC = 0) {

  if (time.toString().includes("8")) {

    var groupID = weekday8PMGroupID, timeCode = 8;
    var lineupToday = currentWeekSheet.getRange(2, dayColumnMapping[dayCode] - 6, 7).getValues().map(name => name[0]).filter(name => name !== "-").filter(name => name !== "");

  } else if (time.toString().includes("10")) {

    var groupID = weekday10PMGroupID, timeCode = 10;
    var lineupToday = currentWeekSheet.getRange(12, dayColumnMapping[dayCode] - 6, 7).getValues().map(name => name[0]).filter(name => name !== "-").filter(name => name !== "");

  }

  if (sendLineup == 1) {
    sendWhatsappMessage(groupID, `Comics for ${timeCode} PM Lineup Today\n\n${lineupToday.join("\n")}`);
  }

  if (sendPOC == 1) {
    var pocSent = 0;
    pocList.forEach(poc => {
      if (lineupToday.includes(poc.split(" ")[0]) && pocSent == 0) {
        sendWhatsappMessage(groupID, `*${poc}* is the POC for today's mic.\nPlease coordinate with them. 🫡`);
        pocSent = 1;
      }
    });
  }

  if (sendBMSLink == 1) {
    var bmsLink = "https://in.bookmyshow.com/events/baking-jokes-a-stand-up-comedy-open-mic/ET00339526";
    var message = `Hey guys! Sharing here the link for today's mic.\n${bmsLink}\n\nKindly mark this *Interested* on BMS as it helps push the event. Thank You. 🫡`;

    sendWhatsappMessage(groupID, message);
  }
}

function postLineupToGroups() {
  const today = new Date().getDay();
  var dayCodeToday = dayNameMapping[today];

  if ("SAT_SUN".includes(dayCodeToday)) {
    return;
  }

  //updatePolls();
  Utilities.sleep(3000);
  postTodaysLineup(dayCodeToday, 8, 0, 1, 1);
  Utilities.sleep(500);
  postTodaysLineup(dayCodeToday, 10, 0, 1, 1);
}

function postLineupToGroupManual() {
  var ui = SpreadsheetApp.getUi();
  var validDayChoices = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Mon", "Tue", "Wed", "Thu", "Fri"];
  var validTimeChoices = ["8 PM", "10 PM", "8", "10"];

  var daySelector = ui.prompt("Enter Day:", `Valid choices: ${validDayChoices.slice(0, 5).join(" | ")}`, ui.ButtonSet.OK).getResponseText();
  var dayCode = validateDay(daySelector, validDayChoices);
  if (!dayCode) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Invalid day selected!\n\nTry Again...");
    return;
  }

  var timeSelector = ui.prompt("Enter the Spot Time:", `Valid choices: ${validTimeChoices.slice(0, 2).join(" | ")}`, ui.ButtonSet.OK).getResponseText();
  var timeCode = validateTime(timeSelector, validTimeChoices);
  if (!timeCode) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Invalid time selected!\n\nTry Again...");
    return;
  }

  postTodaysLineup(dayCode, timeCode, 0);
}

function updatePolls() {
  //Run only on weekdays

  var today = new Date().getDay();

  if ("60".includes(today)) {
    console.log("I'm off on weekends! 🫡")
    return;
  }


  check8PMPoll();
  Utilities.sleep(5000);
  check10PMPoll();
}

function cleanupPollIDs() {
  PropertiesService.getScriptProperties().deleteProperty("pollMessage8PMID");
  PropertiesService.getScriptProperties().deleteProperty("pollMessage10PMID");
}

function cancellationHistoryChecker(name, number) {
  var foundHistoryRow = searchValues(spotHistorySheet.getRange("A1:B"), name, number);

  if (foundHistoryRow == -1) {
    console.log("No Spot History");
    return 0;
  } else {
    var remarks = spotHistorySheet.getRange(`D${foundHistoryRow}`).getValue().toString();

    if (!remarks.toLowerCase().includes("cancel")) {
      console.log("Clean Sheet !");
      return 0;
    } else {
      console.log("Uh Oh!");
      return remarks;
    }
  }

}

function allowMidWeekRequests() {
  PropertiesService.getScriptProperties().setProperty("allowMidWeek", "YES");
}

function stopMidWeekRequests() {
  PropertiesService.getScriptProperties().setProperty("allowMidWeek", "NO");
}

function removeNonAdminComicsFromWeekdayGroups() {

  var groupDetail8PM = getWhatsappGroup(weekday8PMGroupID);
  Utilities.sleep(700);
  var groupDetail10PM = getWhatsappGroup(weekday10PMGroupID);

  if(groupDetail8PM.participants.length == 0 || groupDetail10PM.participants.length == 0) {
    removeNonAdminComicsFromWeekdayGroups();
    return;
  }
  
  var comicsToRemove8PM = groupDetail8PM.participants.filter(comic => !"creator_admin".includes(comic.rank)).map(comic => comic.id);
  Utilities.sleep(700);
  var comicsToRemove10PM = groupDetail10PM.participants.filter(comic => !"creator_admin".includes(comic.rank)).map(comic => comic.id);

  Utilities.sleep(700);

  console.log("Comics to REMOVE for 8PM: " + comicsToRemove8PM);

  (comicsToRemove8PM.length > 0) ? manageWhatsappGroup(weekday8PMGroupID, comicsToRemove8PM, "delete") : console.log("No one to remove!");
  Utilities.sleep(500);

  console.log("Comics to REMOVE for 10PM: " + comicsToRemove10PM);


  (comicsToRemove10PM.length > 0) ? manageWhatsappGroup(weekday10PMGroupID, comicsToRemove10PM, "delete") : console.log("No one to remove!");
  Utilities.sleep(500);

  console.log("Removed Comics From Weekday Mic Groups!");
}

function allowLastWeekRequests() {
  PropertiesService.getScriptProperties().setProperty("allowLastWeek", "YES");
}

function stopLastWeekRequests() {
  PropertiesService.getScriptProperties().setProperty("allowLastWeek", "NO");
}