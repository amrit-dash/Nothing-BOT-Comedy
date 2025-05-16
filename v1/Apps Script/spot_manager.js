// v2 Function
function createSpotRequest(pingDetails) {

  var output;

  if (duplicateSpotCheck(pingDetails) === "YES") {
    pingDetails.reasonCode = "DS";
    pingDetails.statusCode = 400;

    output = createJsonOutput(pingDetails);
    updateRemarks(pingDetails.pingRowNumber, "Spot Request Exists");
    return output;
  } else if (duplicateSpotCheck(pingDetails) === "ALLOCATED") {
    pingDetails.reasonCode = "DS SE";
    pingDetails.statusCode = 400;

    var foundThisWeekRow = searchValues(spotAllocationCurrentWeekSheet.getRange("A1:B"), pingDetails.contactName, pingDetails.formattedNumber);

    if (foundThisWeekRow == -1) {
      pingDetails.customResponse = `Sorry ${pingDetails.firstName}. You do not have a spot this week!`;

    } else {
      var spotStatus = spotAllocationCurrentWeekSheet.getRange(`C${foundThisWeekRow}`);
      var spotTime = spotAllocationCurrentWeekSheet.getRange(`D${foundThisWeekRow}`);

      if (spotStatus.isBlank() || spotTime.isBlank()) {
        pingDetails.customResponse = "Spots for the week has not been allocated yet. Please wait for confirmation.";
      } else if (spotStatus === "NO SPOT") {
        pingDetails.customResponse = `Sorry ${pingDetails.firstName}. You do not have a spot this week!`;
      } else {
        pingDetails.customResponse = `You're already on the *${spotStatus.getValue()}, ${spotTime.getValue()}* lineup this week. Ping me on Sundays to ask for a spot next week. 🫡`;
      }
    }

    output = createJsonOutput(pingDetails);
    updateRemarks(pingDetails.pingRowNumber, "Spot Allocated. Custom Response");
    return output;
  } else if (duplicateSpotCheck(pingDetails) === "NO_PREFERENCE") {
    pingDetails.reasonCode = "DS BP";
    pingDetails.statusCode = 400;

    output = createJsonOutput(pingDetails);
    updateRemarks(pingDetails.pingRowNumber, "Spot Request Exists. Checking Preference");
    return output;
  }

  if (!adminList.includes(pingDetails.contactName.split(" ")[0])) {
    if (checkDay() === "INVALID") {
      pingDetails.reasonCode = "WD";
      pingDetails.statusCode = 402;

      output = createJsonOutput(pingDetails);

      var midWeekSpotSheetNextLine = getLastDataRow(midWeekRequestsSheet) + 1;
      midWeekRequestsSheet.getRange(`A${midWeekSpotSheetNextLine}:D${midWeekSpotSheetNextLine}`).setValues([[pingDetails.contactName, pingDetails.formattedNumber, pingDetails.body, "Mid-Week Spot Request"]]);

      updateRemarks(pingDetails.pingRowNumber, "Asked Spot Mid-Week");
      return output;
    };
  }

  if (checkPOC(pingDetails.contactName) === "YES") {
    pingDetails.reasonCode = "WP";
    pingDetails.statusCode = 403;

    output = createJsonOutput(pingDetails);
    updateRemarks(pingDetails.pingRowNumber, "Is Weekday POC");
    return output;
  };

  if (checkBan(pingDetails.contactName) === "YES") {
    pingDetails.reasonCode = "BC";
    pingDetails.statusCode = 404;

    output = createJsonOutput(pingDetails);
    updateRemarks(pingDetails.pingRowNumber, "Banned Comic Ping");
    return output;
  };

  if (ignoreListCheck(pingDetails.contactName) === "YES") {
    pingDetails.reasonCode = "IC";
    pingDetails.statusCode = 404;

    output = createJsonOutput(pingDetails);
    updateRemarks(pingDetails.pingRowNumber, "Ignorelist Comic Ping");
    return output;
  };

  var nextDataRow = getLastDataRow(spotRequestPingsSheet, "A") + 1;
  pingDetails.spotRequestRowNumber = nextDataRow;

  spotRequestPingsSheet.getRange(`A${nextDataRow}`).setValue(pingDetails.contactName);
  spotRequestPingsSheet.getRange(`B${nextDataRow}`).setValue(pingDetails.formattedNumber);
  spotRequestPingsSheet.getRange(`C${nextDataRow}`).setValue(pingDetails.body);

  var lastWeekCheck = spotRequestPingsSheet.getRange(`D${nextDataRow}`).getValue();

  if (lastWeekCheck === "YES" && overrideLastWeekRequestValue === "NO") {

    pingDetails.reasonCode = "LW";
    pingDetails.statusCode = 401;

    updateRemarks(pingDetails.pingRowNumber, "Had Spot Last Week");
    spotRequestPingsSheet.getRange(`G${nextDataRow}`).setValue("LAST WEEK");
    spotRequestPingsSheet.getRange(`I${nextDataRow}`).insertCheckboxes().check();
  } else {
    pingDetails.reasonCode = "SR";
    pingDetails.statusCode = 202;
    pingDetails.spotAllocationRowNumber = registerSpotRequest(pingDetails);

    updateRemarks(pingDetails.pingRowNumber, "Spot Request Started");
    spotRequestPingsSheet.getRange(`G${nextDataRow}`).setFormula(`='${spotAllocationCurrentWeekSheet.getSheetName()}'!C${pingDetails.spotAllocationRowNumber}`);
    spotRequestPingsSheet.getRange(`H${nextDataRow}`).setFormula(`='${spotAllocationCurrentWeekSheet.getSheetName()}'!D${pingDetails.spotAllocationRowNumber}`);
    spotRequestPingsSheet.getRange(`I${nextDataRow}`).insertCheckboxes();
  };

  output = createJsonOutput(pingDetails);
  return output;
}

function updateSpotPreferences(parameters) {
  var updateRowNumber = (parseInt(parameters.spotRequestRowNumber)) ? parameters.spotRequestRowNumber : searchValues(spotRequestPingsSheet.getRange("A1:B"), parameters.comicName, parameters.comicNumber);

  var preferredDay = parameters.day;
  var preferredTime = parameters.time;

  spotRequestPingsSheet.getRange(`E${updateRowNumber}`).setValue(preferredDay);
  spotRequestPingsSheet.getRange(`F${updateRowNumber}`).setValue(preferredTime);

  updateSpotRequest(parameters);

  updateRemarks(parameters.pingRowNumber, "Spot Request Registered");
}

// v2 Function
function registerSpotRequest(pingDetails) {
  var nextDataRow = getLastDataRow(spotAllocationCurrentWeekSheet) + 1;

  spotAllocationCurrentWeekSheet.getRange(`A${nextDataRow}:B${nextDataRow}`).setValues([[pingDetails.contactName, pingDetails.formattedNumber]]);

  var lastSpotFormula = `=IFERROR( CONCATENATE("Last Spot at Glens: ", DAYS(TODAY(), VLOOKUP(B${nextDataRow}, 'Spot History'!$B$1:$C, 2, FALSE)), " days ago."), "No recorded last spot!")`;
  spotAllocationCurrentWeekSheet.getRange(`E${nextDataRow}`).setFormula(lastSpotFormula);

  var cancellation = cancellationHistoryChecker(pingDetails.contactName, pingDetails.formattedNumber);
  if (cancellation != 0) {
    spotAllocationCurrentWeekSheet.getRange(`E${nextDataRow}`).setNote(cancellation);
  }

  return nextDataRow;
}

// v2 Function
function updateSpotRequest(parameters) {
  var rowNumberAllocationSheet = (parseInt(parameters.spotAllocationRowNumber)) ? parameters.spotAllocationRowNumber : searchValues(spotAllocationCurrentWeekSheet.getRange("A1:B"), parameters.comicName, parameters.comicNumber);

  var preferredDay = parameters.day;
  var preferredTime = parameters.time;

  var remarkTextFormula = `=IFERROR( CONCATENATE("Preference: ${(preferredDay.toString().toLowerCase().includes("any") && preferredTime.toString().toLowerCase().includes("any")) ? "Anything Works!" : `${preferredDay}, ${preferredTime}`}\nLast Spot at Glens: ", DAYS(TODAY(), VLOOKUP(B${rowNumberAllocationSheet}, 'Spot History'!$B$1:$C, 2, FALSE)), " days ago."), "Preference: ${(preferredDay.toString().toLowerCase().includes("any") && preferredTime.toString().toLowerCase().includes("any")) ? "Anything Works!" : `${preferredDay}, ${preferredTime}`}\nNo recorded last spot!")`;

  spotAllocationCurrentWeekSheet.getRange(`E${rowNumberAllocationSheet}`).setFormula(remarkTextFormula);

}

function clearSpotRequest(parameters) {
  var rowNumberRequestsSheet = (parseInt(parameters.spotRequestRowNumber)) ? parameters.spotRequestRowNumber : searchValues(spotRequestPingsSheet.getRange("A1:B"), parameters.comicName, parameters.comicNumber);
  var rowNumberAllocationSheet = (parseInt(parameters.spotAllocationRowNumber)) ? parameters.spotAllocationRowNumber : searchValues(spotAllocationCurrentWeekSheet.getRange("A1:B"), parameters.comicName, parameters.comicNumber);

  spotAllocationCurrentWeekSheet.getRange(`A${rowNumberAllocationSheet}:E${rowNumberAllocationSheet}`).clearContent().clearNote();
  spotRequestPingsSheet.getRange(`A${rowNumberRequestsSheet}:I${rowNumberRequestsSheet}`).clearContent().removeCheckboxes();

  updateRemarks(parameters.pingRowNumber, "Spot Request Cancelled");
}

// v3 Function
function giveAdHocSpot() {
  var ui = SpreadsheetApp.getUi();
  var validDayChoices = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Mon", "Tue", "Wed", "Thu", "Fri"];
  var validTimeChoices = ["8 PM", "10 PM", "8", "10"];
  var today = dayNameMapping[new Date().getDay()];

  var getName = ui.prompt("Give Ad-Hoc Spot", "Enter name of comic to search.", ui.ButtonSet.OK_CANCEL);
  if (getName.getSelectedButton() != ui.Button.OK) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Cancelled!");
    return;
  }

  var name = getName.getResponseText();
  var contact = People.People.searchContacts({
    query: name,
    readMask: 'names,phoneNumbers'
  });

  if (!contact.results) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Did not find any matched contact!\n\nTry Again...");
    return;
  }

  // Extract first contact information
  var person = contact.results[0].person;
  var name = person.names[0].displayName;
  var phones = person.phoneNumbers.map(phn => phn.canonicalForm);

  var confirmName = ui.alert("Is this the correct contact?", `Name: ${name}`, ui.ButtonSet.YES_NO);
  if (confirmName != ui.Button.YES) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Incorrect contact found!\n\nTry Again...");
    return;
  }

  var sendTo = selectPhoneNumber(phones, ui);
  if (!sendTo) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Incorrect number selected!\n\nTry Again...");
    return;
  }

  // Prompt for day selection
  var daySelector = ui.prompt("Enter the Spot Day:", `Valid choices: ${validDayChoices.slice(0, 5).join(" | ")}`, ui.ButtonSet.OK).getResponseText();
  var dayCode = validateDay(daySelector, validDayChoices);
  if (!dayCode) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Invalid day selected!\n\nTry Again...");
    return;
  }

  var parameters = getDayParameters(dayCode, today);

  // Prompt for time selection
  var timeSelector = ui.prompt("Enter the Spot Time:", `Valid choices: ${validTimeChoices.slice(0, 2).join(" | ")}`, ui.ButtonSet.OK).getResponseText();
  var timeCode = validateTime(timeSelector, validTimeChoices);
  if (!timeCode) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Invalid time selected!\n\nTry Again...");
    return;
  }

  parameters.timeCode = timeCode;
  parameters.dayCode = dayCode;
  parameters.time = `${timeCode}:00 PM`;

  var send = sendPostRequestToTwilioFlow(sendTo, name.split(" ")[0], "", "ad_hoc_spot", parameters);

  if (send == 1) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Ad-Hoc Spot Request Sent!");
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast("Could not send spot Request!\n\nTry Again...");
  }
}

// v2 Function
function adHocSpotUpdate(parameters) {

  var spotDay = parameters.spotDay;
  var spotTime = (parameters.spotTime.includes("8") ? "8:00 PM" : "10:00 PM"); //for_v2

  var firstName = parameters.name;
  var number = parameters.number.split(":")[1];
  var contactName = (findContact(number, "phone") === "NA") ? firstName : findContact(number, "phone")[0];

  var currentWeekNextRow = getLastDataRow(spotAllocationCurrentWeekSheet) + 1;
  var spotPingsNextRow = getLastDataRow(spotRequestPingsSheet) + 1;

  spotAllocationCurrentWeekSheet.getRange(`A${currentWeekNextRow}:D${currentWeekNextRow}`).setValues([[contactName, number, spotDay, spotTime]]);

  var updateToLineup = fillInNextBlank(spotDay, spotTime, contactName, spotAllocationCurrentWeekSheet);
  if (updateToLineup == 0) {
    spotAllocationCurrentWeekSheet.getRange(`C${currentWeekNextRow}`).clearContent();
    spotAllocationCurrentWeekSheet.getRange(`D${currentWeekNextRow}`).clearContent();
  }

  var lastSpotFormula = `=IFERROR( CONCATENATE("Ad-Hoc Spot\nLast Spot at Glens: ", DAYS(TODAY(), VLOOKUP(B${currentWeekNextRow}, 'Spot History'!$B$1:$C, 2, FALSE)), " days ago."), "Ad-Hoc Spot\nNo recorded last spot!")`;
  spotAllocationCurrentWeekSheet.getRange(`E${currentWeekNextRow}`).setFormula(lastSpotFormula);

  spotRequestPingsSheet.getRange(`A${spotPingsNextRow}:C${spotPingsNextRow}`).setValues([[contactName, number, "Ad-Hoc Spot."]]);
  //spotRequestPingsSheet.getRange(`G${spotPingsNextRow}`).setFormula(`='${spotAllocationCurrentWeekSheet.getSheetName()}'!C${currentWeekNextRow}`);
  spotRequestPingsSheet.getRange(`G${spotPingsNextRow}`).setValue(spotDay);
  spotRequestPingsSheet.getRange(`H${spotPingsNextRow}`).setValue(spotTime);
  spotRequestPingsSheet.getRange(`I${spotPingsNextRow}`).insertCheckboxes().check();

  Utilities.sleep(1000);

  var todayDayCode = dayNameMapping[new Date().getDay()];
  if (spotDay === todayDayCode) {
    manageWhatsappGroup((spotTime.includes("8") ? weekday8PMGroupID : weekday10PMGroupID), [normalizePhoneNumber(number)], "add");
    //postTodaysLineup(todayDayCode, spotTime);
  }

}



// Page Testing Function
function test1() {
  //console.log();


  console.log();
}