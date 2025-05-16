/**
// v2 currently in use

function onEdit(e) {
  //var rangeNotation = e.range.getA1Notation();
  //var startRow = e.range.getRow();
  //var endRow = e.range.getLastRow();
  var sheetName = e.source.getSheetName();

  if (sheetName.includes("Spot Allocation -")) {
    var editedCell = e.range;
    var editedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

    // Check if the edited cell is in column C
    if (editedCell.getColumn() == 3 && editedCell.getRow() > 1) {
      var day = editedCell.getValue(); // Get the selected day
      var name = editedSheet.getRange(editedCell.getRow(), 1).getValue(); // Get the corresponding name from column A

      // Define the day-to-column mapping
      var dayColumnMapping = {
        "MON": 7, // Column G
        "TUE": 8, // Column H
        "WED": 9, // Column I
        "THU": 10, // Column J
        "FRI": 11 // Column K
      };

      if (day === "NO SPOT") {
        findAndDelValueInRange(editedSheet.getRange("G2:K8"), name);
        return;
      }

      if(dayColumnMapping[e.oldValue]) {
        findAndDelValueInRange(editedSheet.getRange("G2:K8"), name);
      }

      // Get the target column based on the selected day
      var targetColumn = dayColumnMapping[day];

      // If a valid day is selected
      if (targetColumn) {
        var found = 0;

        // Find the next blank cell in the target column (from row 2 to row 8)
        for (var row = 2; row <= 8; row++) {
          var cell = editedSheet.getRange(row, targetColumn);
          if (cell.getValue() === "" || cell.getValue() === "-") {
            cell.setValue(name); // Place the name in the next blank cell
            found = 1;
            break; // Stop once the first blank cell is found
          }
        }
        if (found == 0) {
          editedCell.clearContent();
          return;
        }
      }
    }
  } else {
    return;
  }
}

function onEditV1(e) {
  var sheetName = e.source.getSheetName();

  var editedCell = e.range;
  var editedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  var name = editedSheet.getRange(editedCell.getRow(), 1).getValue();
  var number = editedSheet.getRange(editedCell.getRow(), 2).getValue();
  var spotDay = editedSheet.getRange(editedCell.getRow(), 3);
  var spotTime = editedSheet.getRange(editedCell.getRow(), 4);

  if (sheetName.includes("Spot Allocation -") && sheetName.includes("v2")) {

    // Check for the update of time in column D    
    if (editedCell.getColumn() == 4 && editedCell.getRow() > 1) {
      if (e.oldValue) {
        findAndDelValueInRange(editedSheet.getRange("G2:K17"), name);
        updateNotificationCheckbox(name, number, editedCell.getRow(), spotDay, 0);
      }

      if (spotDay.isBlank()) {
        console.error("Spot day is not mentioned.");
        return;
      }

      var updateToLineup = fillInNextBlank(spotDay.getValue(), spotTime.getValue(), name, editedSheet);
      if (updateToLineup == 0) {
        editedCell.clearContent();
        return;
      }

    } else if (editedCell.getColumn() == 3 && editedCell.getRow() > 1) {

      if (editedCell.getValue() === "NO SPOT") {
        findAndDelValueInRange(editedSheet.getRange("G2:K17"), name);
        updateNotificationCheckbox(name, number, editedCell.getRow(), spotDay, 0);
        spotTime.clearContent();
      }

      if (editedCell.getValue() === "CANCELLED" && e.oldValue && !"CANNED,NO SPOT".includes(e.oldValue)) {
        var todayDay = dayNameMapping[new Date().getDay()];
        var todayDayCode = todayDay.substring(0, 3).toUpperCase();

        if (todayDayCode === e.oldValue) {
          manageWhatsappGroup((spotTime.getValue().toString().includes("8")) ? weekday8PMGroupID : weekday10PMGroupID, [normalizePhoneNumber(number)], "delete");
        }

        editedCell.setNote(`Had Spot On: ${e.oldValue}`);
        findAndDelValueInRange(editedSheet.getRange("G2:K17"), name);
        spotTime.clearContent();
        return;
      }

      if (e.oldValue) {
        findAndDelValueInRange(editedSheet.getRange("G2:K17"), name);
        updateNotificationCheckbox(name, number, editedCell.getRow(), spotDay, 0);
      }

      if (spotTime.isBlank()) {
        console.error("Spot time is not mentioned.");
        return;
      }

      var updateToLineup = fillInNextBlank(spotDay.getValue(), spotTime.getValue(), name, editedSheet);
      if (updateToLineup == 0) {
        editedCell.clearContent();
        return;
      }

    }
  } else if (sheetName.includes("Spot Allocation -") && !sheetName.includes("v2")) {

    if (editedCell.getColumn() == 3 && editedCell.getRow() > 1) {
      if (editedCell.getValue() === "NO SPOT") {
        findAndDelValueInRange(editedSheet.getRange("G2:K8"), name);
        updateNotificationCheckbox(name, number, editedCell.getRow(), spotDay, 0);
      }

      if (e.oldValue) {
        findAndDelValueInRange(editedSheet.getRange("G2:K8"), name);
        updateNotificationCheckbox(name, number, editedCell.getRow(), spotDay, 0);
      }

      var updateToLineup = fillInNextBlankV1(spotDay.getValue(), name, editedSheet);
      if (updateToLineup == 0) {
        editedCell.clearContent();
        return;
      }
    }
  }
}

*/



/**
 * Replaced with new validation function 
 * 

// v2 Function
function dailyCheck() {

  const today = new Date().getDay();

  //var daysToCheck = (monCheck == 0) ? "601" : "60";
  var daysToCheck = "601"; // Won't run on SAT, SUN & MON

  if (daysToCheck.includes(today.toString())) {
    return;
  }

  var dayCodeToday = dayNameMapping[today];
  var dayCodeYesterday = dayNameMapping[today - 1];

  var allComics = spotAllocationCurrentWeekSheet.getRange("A2:D").getValues();

  var comicsToday = allComics.filter(comic => comic[2] === dayCodeToday);
  var comicsYesterday = allComics.filter(comic => comic[2] === dayCodeYesterday);

  var comicDetails = comicsToday.map(comic => {
    return {
      "comicName": comic[0],
      "comicNumber": comic[1],
      "normalizedNumber": normalizePhoneNumber(comic[1]),
      "spotTime": comic[3],
      "message": `Hey ${comic[0].toString().split(" ")[0]}. You have a *${comic[3]}* spot today at *Glens Bakehouse, Koramangala*.\n\nKindly proceed with the self-service and get yourself added to the group: ${(comic[3].includes("8") ? whatsapp8PMGroupLink : whatsapp10PMGroupLink)}\n\n\n_N.B. To make sure you're automatically added to the group, you need to save Amrit's contact._`
    };
  });

  var comicsToAdd8PM = comicDetails.filter(comic => comic.spotTime === "8:00 PM").map(comic => comic.normalizedNumber);
  var comicsToAdd10PM = comicDetails.filter(comic => comic.spotTime === "10:00 PM").map(comic => comic.normalizedNumber);

  var comicsToRemove8PM = comicsYesterday.filter(comic => comic[3] === "8:00 PM").map(comic => normalizePhoneNumber(comic[1]));
  var comicsToRemove10PM = comicsYesterday.filter(comic => comic[3] === "10:00 PM").map(comic => normalizePhoneNumber(comic[1]));

  var remove10PM, remove8PM, groupDetail;

  if (comicsToRemove8PM.length == 0) {
    groupDetail = getWhatsappGroup(weekday8PMGroupID);
    comicsToRemove8PM = groupDetail.participants.filter(comic => !"creator_admin".includes(comic.rank)).map(comic => comic.id);
  }

  if (comicsToRemove10PM.length == 0) {
    groupDetail = getWhatsappGroup(weekday10PMGroupID);
    comicsToRemove10PM = groupDetail.participants.filter(comic => !"creator_admin".includes(comic.rank)).map(comic => comic.id);
  }

  (comicsToRemove8PM.length > 0) ? remove8PM = manageWhatsappGroup(weekday8PMGroupID, comicsToRemove8PM, "delete") : console.log("No one to remove!");
  Utilities.sleep(500);
  (comicsToRemove10PM.length > 0) ? remove10PM = manageWhatsappGroup(weekday10PMGroupID, comicsToRemove10PM, "delete") : console.log("No one to remove!");
  Utilities.sleep(500);

  if (remove8PM === "404") {
    comicsToRemove8PM.forEach(comic => {
      manageWhatsappGroup(weekday8PMGroupID, [comic], "delete");
      Utilities.sleep(500);
    });
  }

  if (remove10PM === "404") {
    comicsToRemove10PM.forEach(comic => {
      manageWhatsappGroup(weekday10PMGroupID, [comic], "delete");
      Utilities.sleep(500);
    });
  }

  (comicsToAdd8PM.length > 0) ? manageWhatsappGroup(weekday8PMGroupID, comicsToAdd8PM, "add") : console.log("No one to add!");
  Utilities.sleep(500);
  (comicsToAdd10PM.length > 0) ? manageWhatsappGroup(weekday10PMGroupID, comicsToAdd10PM, "add") : console.log("No one to add!");
  Utilities.sleep(500);

  comicDetails.forEach(comic => {
    sendPostRequestToTwilioFlow(`whatsapp:${comic.comicNumber}`, comic.comicName, comic.message, "send_message");
  });

  postTodaysLineup(dayCodeToday, "8PM", 1, 0);
  Utilities.sleep(500);
  postTodaysLineup(dayCodeToday, '10PM', 1, 0);

}
 
function checkSpotEnquiry(pingDetails) {
  var messageText = pingDetails.body;
  var output;

  if (messageText.toLowerCase().includes("spot")) {
    output = createSpotRequest(pingDetails);
  } else {
    output = checkCustomResponse(pingDetails);
  }

  return output;
}

*/



/**
// v1 Functions - with only 10:00 PM handling.

function duplicateSpotCheckV1(pingDetails) {
  var entryExistsCheck = searchValues(spotAllocationCurrentWeekSheet.getRange("A1:B"), pingDetails.contactName, pingDetails.formattedNumber);

  if (entryExistsCheck != -1) {
    var preferenceCell = spotAllocationCurrentWeekSheet.getRange(`D${entryExistsCheck}`);
    var allocationCell = spotAllocationCurrentWeekSheet.getRange(`C${entryExistsCheck}`);

    if (preferenceCell.isBlank()) {
      var lastSpotFormula = `=IFERROR( CONCATENATE("Last Spot at Glens: ", DAYS(TODAY(), VLOOKUP(B${entryExistsCheck}, 'Spot History'!$B$1:$C, 2, FALSE)), " days ago."), "No recorded last spot!")`;

      preferenceCell.setFormula(lastSpotFormula);
    }

    if (!allocationCell.isBlank()) {
      return "ALLOCATED";
    } else if (!preferenceCell.getValue().toString().toLowerCase().includes("preference:")) {
      return "NO_PREFERENCE";
    } else {
      return "YES";
    }
  } else {
    return "NO"
  }
  
}

function updateSpotRequestV1(parameters) {
  var rowNumberAllocationSheet = (parseInt(parameters.spotAllocationRowNumber)) ? parameters.spotAllocationRowNumber : searchValues(spotAllocationCurrentWeekSheet.getRange("A1:B"), parameters.comicName, parameters.comicNumber);

  var preferredDay = parameters.day;
  var preferredTime = parameters.time;

  var remarkTextFormula = `=IFERROR( CONCATENATE("Preference: ${(preferredDay.toString().toLowerCase().includes("any") && preferredTime.toString().toLowerCase().includes("any")) ? "Anything Works!" : `${preferredDay}, ${preferredTime}`}\nLast Spot at Glens: ", DAYS(TODAY(), VLOOKUP(B${rowNumberAllocationSheet}, 'Spot History'!$B$1:$C, 2, FALSE)), " days ago."), "Preference: ${(preferredDay.toString().toLowerCase().includes("any") && preferredTime.toString().toLowerCase().includes("any")) ? "Anything Works!" : `${preferredDay}, ${preferredTime}`}\nNo recorded last spot!")`;

  spotAllocationCurrentWeekSheet.getRange(`D${rowNumberAllocationSheet}`).setFormula(remarkTextFormula);

 /**

 * Hardcoded Remarks - Old Version - End Part of updateSpotRequest()

  var comicName = spotAllocationCurrentWeekSheet.getRange(`A${rowNumberAllocationSheet}`);
  var phoneNumber = spotAllocationCurrentWeekSheet.getRange(`B${rowNumberAllocationSheet}`);

  var foundHistoryRow = searchValues(spotHistorySheet.getRange("A1:B"), comicName, phoneNumber);

  if (foundHistoryRow == -1 || spotHistorySheet.getRange(`C${foundHistoryRow}`).isBlank()) {
    var lastSpot = "No Recorded Last Spot";
  } else {
    var lastSpot = spotHistorySheet.getRange(`C${foundHistoryRow}`).getValue();
  }

  var remarkText = `Preference: ${(preferredDay.toString().toLowerCase().includes("any") && preferredTime.toString().toLowerCase().includes("any")) ? "Anything Works!" : `${preferredDay}, ${preferredTime}`}\nLast Spot at Glens: ${lastSpot}`;

  spotAllocationCurrentWeekSheet.getRange(`D${rowNumberAllocationSheet}`).setValue(remarkText);

 *%/%

}

function adHocSpotUpdateV1(parameters) {
  var buttonPayload = parameters.buttonPayload.split("_");

  var spotDay = buttonPayload[2];
  var spotTime = buttonPayload[3]; //for_v2

  var firstName = parameters.name;
  var number = parameters.number.split(":")[1];
  var contactName = (findContact(number, "phone") === "NA") ? firstName : findContact(number, "phone")[0];

  var currentWeekNextRow = getLastDataRow(spotAllocationCurrentWeekSheet) + 1;
  var spotPingsNextRow = getLastDataRow(spotRequestPingsSheet) + 1;

  spotAllocationCurrentWeekSheet.getRange(`A${currentWeekNextRow}:C${currentWeekNextRow}`).setValues([[contactName, number, spotDay]]);

  var updateToLineup = fillInNextBlankV1(spotDay, contactName, spotAllocationCurrentWeekSheet);
  if (updateToLineup == 0) {
    spotAllocationCurrentWeekSheet.getRange(`C${currentWeekNextRow}`).clearContent();
  }

  var lastSpotFormula = `=IFERROR( CONCATENATE("Ad-Hoc Spot\nLast Spot at Glens: ", DAYS(TODAY(), VLOOKUP(B${currentWeekNextRow}, 'Spot History'!$B$1:$C, 2, FALSE)), " days ago."), "Ad-Hoc Spot\nNo recorded last spot!")`;
  spotAllocationCurrentWeekSheet.getRange(`D${currentWeekNextRow}`).setFormula(lastSpotFormula);

  spotRequestPingsSheet.getRange(`A${spotPingsNextRow}:C${spotPingsNextRow}`).setValues([[contactName, number, "Ad-Hoc Spot."]]);
  spotRequestPingsSheet.getRange(`G${spotPingsNextRow}`).setFormula(`='${spotAllocationCurrentWeekSheet.getSheetName()}'!C${currentWeekNextRow}`);
  spotRequestPingsSheet.getRange(`H${spotPingsNextRow}`).insertCheckboxes().check();

  Utilities.sleep(1000);

  var todayDayCode = dayNameMapping[new Date().getDay()];
  if (spotDay === todayDayCode) {
    manageWhatsappGroup(weekday10PMGroupID, [normalizePhoneNumber(number)], "add");
    postTodaysLineup(todayDayCode);
  }

}

function registerSpotRequestV1(pingDetails) {
  var nextDataRow = getLastDataRow(spotAllocationCurrentWeekSheet, "A") + 1;

  spotAllocationCurrentWeekSheet.getRange(`A${nextDataRow}:B${nextDataRow}`).setValues([[pingDetails.contactName, pingDetails.formattedNumber]]);

  var lastSpotFormula = `=IFERROR( CONCATENATE("Last Spot at Glens: ", DAYS(TODAY(), VLOOKUP(B${nextDataRow}, 'Spot History'!$B$1:$C, 2, FALSE)), " days ago."), "No recorded last spot!")`;
  spotAllocationCurrentWeekSheet.getRange(`D${nextDataRow}`).setFormula(lastSpotFormula);

  return nextDataRow;
}

function createSpotRequestV1(pingDetails) {

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

      if (spotStatus.isBlank()) {
        pingDetails.customResponse = "Spots for the week has not been allocated yet. Please wait for confirmation.";
      } else if (spotStatus === "NO SPOT") {
        pingDetails.customResponse = `Sorry ${pingDetails.firstName}. You do not have a spot this week!`;
      } else {
        pingDetails.customResponse = `You're already on the *${spotStatus.getValue()}, 10:00 PM* lineup this week. Ping me on Sundays to ask for a spot on next week. 🫡`;
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

  if (lastWeekCheck === "YES") {
    pingDetails.reasonCode = "LW";
    pingDetails.statusCode = 401;

    updateRemarks(pingDetails.pingRowNumber, "Had Spot Last Week");
    spotRequestPingsSheet.getRange(`G${nextDataRow}`).setValue("LAST WEEK");
    spotRequestPingsSheet.getRange(`H${nextDataRow}`).insertCheckboxes().check();
  } else {
    pingDetails.reasonCode = "SR";
    pingDetails.statusCode = 202;
    pingDetails.spotAllocationRowNumber = registerSpotRequest(pingDetails);

    updateRemarks(pingDetails.pingRowNumber, "Spot Request Started");
    spotRequestPingsSheet.getRange(`G${nextDataRow}`).setFormula(`='${spotAllocationCurrentWeekSheet.getSheetName()}'!C${pingDetails.spotAllocationRowNumber}`);
    spotRequestPingsSheet.getRange(`H${nextDataRow}`).insertCheckboxes();
  };

  output = createJsonOutput(pingDetails);
  return output;
}

function checkCustomResponseV1(pingDetails) {
  var messageText = pingDetails.body;
  var output;

  if (messageText.toLowerCase().match(/.*who.*are.*you.*%/ %)) {
    pingDetails.reasonCode = "NP";
    pingDetails.statusCode = 200;
    pingDetails.body = "who_am_i";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*what.*can.*you.*do.*%/ %) || messageText.toLowerCase().match(/.*main.*menu.*%/ %) || messageText.toLowerCase().match(/.*help.*me.*%/ %)) {
    pingDetails.reasonCode = "NP";
    pingDetails.statusCode = 200;
    pingDetails.body = "main_menu";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*cancel.*my.*%/ %) || messageText.toLowerCase().match(/.*i.*back.*out.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "I cannot yet cancel spots. It's being built as we speak! Really!\n\nFor now, ping Amrit if you are backing out!";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*all.*feature.*%/ %) || messageText.toLowerCase().match(/.*feature.*list.*%/ %) || messageText.toLowerCase().match(/.*feature*%/ %)) {
    pingDetails.reasonCode = "NP";
    pingDetails.statusCode = 200;
    pingDetails.body = "all_features";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*when.*does.*happen.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Weekday mics at Glens happens on Monday to Friday, both at 8:00 PM and 10:00 PM.";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*where.*glen.*%/ %) || messageText.toLowerCase().match(/.*how.*to.*reach.*glen.*%/ %) || messageText.toLowerCase().match(/.*where.*happen.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "This mic happens at Glens Bakehouse, Koramangala.\n\nGoogle Maps: https://maps.app.goo.gl/dXnzYav9uw5UfsmH8";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*last.*time.*%/ %) || messageText.toLowerCase().match(/.*last.*spot.*at.*glen.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;

    var foundHistoryRow = searchValues(spotHistorySheet.getRange("A1:B"), pingDetails.contactName, pingDetails.formattedNumber);

    pingDetails.customResponse = (foundHistoryRow == -1) ? "I have no records of the last time you did a spot at Glens. Will update after next spot." : `Your last spot at Glens was on ${spotHistorySheet.getRange(`C${foundHistoryRow}`).getValue()}.`;

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*up.*this.*week.*\?.*%/ %) || messageText.toLowerCase().match(/.*have.*this.*week.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;

    var foundThisWeekRow = searchValues(spotAllocationCurrentWeekSheet.getRange("A1:B"), pingDetails.contactName, pingDetails.formattedNumber);

    if (foundThisWeekRow == -1) {
      pingDetails.customResponse = `Sorry ${pingDetails.firstName}. You do not have a spot this week!`;

    } else {
      var spotStatus = spotAllocationCurrentWeekSheet.getRange(`C${foundThisWeekRow}`);

      if (spotStatus.isBlank()) {
        pingDetails.customResponse = "Spots for the week has not been allocated yet. Please wait for confirmation.";
      } else if (spotStatus === "NO SPOT") {
        pingDetails.customResponse = `Sorry ${pingDetails.firstName}. You do not have a spot this week!`;
      } else {
        pingDetails.customResponse = `This week, you're up on ${spotStatus.getValue()}, 10:00 PM.`;
      }
    }

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*pizza.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Hey-yo, It's not *Dominos* this side!";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*sandwich.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Did you try pinging *Zomato* instead?";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*burger.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Knight to D3. And checkmate *Burger King*.";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*thank[s]{0,1}.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "You're most welcome!";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else if (messageText.toLowerCase().match(/.*yep.*book me.*%/ %)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Sorry. The spot is no longer available!";

    updateRemarks(pingDetails.pingRowNumber, "Request Expired");
  } else if (["okay", "ok", "👍", "got it", "gotcha", "yes", "yeah", "no", "nope"].some(substring => messageText.toLowerCase().includes(substring))) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "🫡";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response");
  } else {
    return "NA";
  }

  output = createJsonOutput(pingDetails);
  return output;
}

//spot_allocation.gs

function postTodaysLineupV1(dayCode) {
  var lineupToday = currentWeekSheet.getRange(2, dayColumnMapping[dayCode] - 6, 7).getValues().map(name => name[0]).filter(name => name !== "-").filter(name => name !== "");
  sendWhatsappMessage(weekday10PMGroupID, "Today's 10 PM Lineup\n\n" + lineupToday.join("\n"))
}

function micUpdateV1(parameters) {
  const yesterday = new Date().getDay() - 1;
  var status10PM = parameters.status10PM;

  var dayName = dayNameMapping[yesterday];

  if (status10PM.toLowerCase().includes("no") || status10PM.toLowerCase().includes("didnt happen")) {
    spotAllocationCurrentWeekSheet.getRange(2, dayColumnMapping[dayName], 7).clearContent();
    findAndChangeValueInRange(spotAllocationCurrentWeekSheet.getRange("C2:C"), dayName, "CANNED");
  }
}

function dailyCheckV1(monCheck = 0) {
  var currentWeekSheetLastRow = getLastDataRow(spotAllocationCurrentWeekSheet);
  var spotStatus, comicName, comicNumber, message, comicsToAdd = [], comicsToRemove = [];
  const today = new Date().getDay();

  var daysToCheck = (monCheck == 0) ? "601" : "60";

  if (daysToCheck.includes(today.toString())) {
    return;
  }

  for (let i = 2; i <= currentWeekSheetLastRow; i++) {
    spotStatus = spotAllocationCurrentWeekSheet.getRange(`C${i}`).getValue();

    if (spotStatus === dayNameMapping[today] || spotStatus === dayNameMapping[today - 1]) {
      comicName = spotAllocationCurrentWeekSheet.getRange(`A${i}`).getValue().toString().split(" ")[0];
      comicNumber = spotAllocationCurrentWeekSheet.getRange(`B${i}`).getValue();

      if (spotStatus === dayNameMapping[today - 1]) {
        comicsToRemove.push(normalizePhoneNumber(comicNumber));
      } else {
        comicsToAdd.push(normalizePhoneNumber(comicNumber));

        message = `Hey ${comicName}. You have a *10 PM* spot today at *Glens Bakehouse, Koramangala*.\n\nKindly proceed with the self-service and get yourself added to the group: ${whatsapp10PMGroupLink}\n\n\nP.S. In case the link doesn't work, Amrit will get you added to the group!`;

        sendPostRequestToTwilioFlow(`whatsapp:${comicNumber}`, comicName, message, "send_message");
        console.log(message);
      }
    } else {
      continue;
    }

  }

  manageWhatsappGroup(weekday10PMGroupID, comicsToRemove, "delete");
  Utilities.sleep(500);
  manageWhatsappGroup(weekday10PMGroupID, comicsToAdd, "add");
  Utilities.sleep(500);
  postTodaysLineup(dayNameMapping[today]);

}

function updateFormulasV1() {
  spotRequestPingsSheet.getRange("D1").setFormula(`=ARRAYFORMULA(IF(A1:A<>"",IF(A1:A = "Ping From","LAST WEEK CHECK?",IF(IFERROR(SEARCH({A1:A},CONCATENATE('Spot Allocation - Last Week'!G2:K8)),"")<>"","YES","")),""))`);

  currentWeekSheet.getRange("A2").setFormula(`=ARRAYFORMULA(IF('Spot Allocation - Next Week'!G2:K8 = "", "", REGEXEXTRACT('Spot Allocation - Next Week'!G2:K8, "^\\S+")))`);
}

function startSpotAllocationV1() {
  updateSpotHistory();
  Utilities.sleep(10000);
  archivePreviousSheets();
  archiveAllPingRequests();
  cleanupSpotRequestsSheet();

  spotAllocationTemplateSheet.copyTo(SpreadsheetApp.getActiveSpreadsheet()).setName("Spot Allocation - Next Week").showSheet().activate();
  SpreadsheetApp.getActiveSpreadsheet().moveActiveSheet(2);

  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Spot Allocation - Last Week").getRange("G12:L19").copyTo(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Spot Allocation - Next Week").getRange("G12:L19"));

  Utilities.sleep(3000);

  updateFormulas();

}

function fillInNextBlankV1(day, name, editedSheet) {

  // Get the target column based on the selected day
  var targetColumn = dayColumnMapping[day];

  // If a valid day is selected
  if (targetColumn) {
    var found = 0;

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

  }

}

*/


/**
 * Counts the number of cells with strikethrough text in a named range.
 * @param {Array} inputRange A 2D array of values from the named range.
 * @return {number} The number of cells with strikethrough text.
 * @customfunction
 */

/**
 * 
 * DEPRECATED

function COUNTSTRIKETHROUGH(inputRange) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var rangeName = "SPOT_LISTS";
  
  // Get the range object based on the named range
  var range = sheet.getRange(rangeName); // Use the named range directly
  
  var strikeThroughCount = 0;
  
  // Loop through each cell in the input array
  var numRows = inputRange.length;
  var numCols = inputRange[0].length;
  
  for (var i = 1; i <= numRows; i++) {
    for (var j = 1; j <= numCols; j++) {
      var cell = range.getCell(i, j); // Get the cell at the current index
      var textStyle = cell.getTextStyle(); // Get the text style
      
      // Check if the cell has strikethrough formatting
      if (textStyle && textStyle.isStrikethrough()) {
        strikeThroughCount++;
      }
    }
  }
  
  return strikeThroughCount;
}

*/

/**
// v2 Function

function giveAdHocSpot() {
  var ui = SpreadsheetApp.getUi();
  var getName = ui.prompt("Give Ad-Hoc Spot", "Enter name of comic to search.", ui.ButtonSet.OK_CANCEL);

  var parameters = {};

  if (getName.getSelectedButton() == ui.Button.OK) {
    var name = getName.getResponseText();
    var contact = People.People.searchContacts({
      query: name,
      readMask: 'names,phoneNumbers'
    });

    if (contact.results) {
      var name = contact.results[0].person.names[0].displayName;
      var phones = contact.results[0].person.phoneNumbers.map(phn => phn.canonicalForm);

      var confirmName = ui.alert("Is this the correct contact?", `Name: ${name}`, ui.ButtonSet.YES_NO);
      if (confirmName == ui.Button.YES) {
        if (phones.length > 1) {
          var numberSelector = ui.prompt("Select the Phone Number:", `Enter 1 for first number, 2 for second and so on.\n\n${phones.join("\n")}`, ui.ButtonSet.OK).getResponseText();

          if (parseInt(numberSelector) > 0 && parseInt(numberSelector) <= phones.length) {
            var sendTo = `whatsapp:${phones[parseInt(numberSelector) - 1]}`;
          } else {
            SpreadsheetApp.getActiveSpreadsheet().toast("Incorrect number selected!\n\nTry Again...");
            return;
          }

        } else if (phones.length == 1) {
          var sendTo = `whatsapp:${phones[0]}`;
        }

        var validDayChoices = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Mon", "Tue", "Wed", "Thu", "Fri"];
        var validTimeChoices = ["8 PM", "10 PM", "8", "10"];

        var daySelector = ui.prompt("Enter the Spot Day:", `Valid choices: ${validDayChoices.slice(0, 5).join(" | ")}`, ui.ButtonSet.OK).getResponseText();

        if (validDayChoices.join(" ").toLowerCase().includes(daySelector.toLowerCase())) {
          var today = dayNameMapping[new Date().getDay()];
          parameters.dayCode = daySelector.substring(0, 3).toUpperCase();

          var date = getOccurrenceOfDay(parameters.dayCode, "next");

          if (parameters.dayCode === today) {
            parameters.day = "Today";
          } else {
            parameters.day = date;
          }

        } else {
          SpreadsheetApp.getActiveSpreadsheet().toast("Invalid day selected!\n\nTry Again...");
          return;
        }

        var timeSelector = ui.prompt("Enter the Spot Time:", `Valid choices: ${validTimeChoices.slice(0, 2).join(" | ")}`, ui.ButtonSet.OK).getResponseText();

        if (validTimeChoices.includes(timeSelector)) {
          parameters.timeCode = parseInt(timeSelector);
          parameters.time = `${parseInt(timeSelector)}:00 PM`;

        } else {
          SpreadsheetApp.getActiveSpreadsheet().toast("Invalid time selected!\n\nTry Again...");
          return;
        }

        var send = sendPostRequestToTwilioFlow(sendTo, name.split(" ")[0], "", "ad_hoc_spot", parameters);

        if (send == 1) {
          SpreadsheetApp.getActiveSpreadsheet().toast("Ad-Hoc Spot Request Sent!");
        } else {
          SpreadsheetApp.getActiveSpreadsheet().toast("Could not send spot Request!\n\nTry Again...");
          return;
        }
      } else {
        SpreadsheetApp.getActiveSpreadsheet().toast("Incorrect contact found!\n\nTry Again...");
        return;
      }

    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast("Did not find any matched contact!\n\nTry Again...");
      return;
    }
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast("Cancelled!");
    return;
  }
}
*/