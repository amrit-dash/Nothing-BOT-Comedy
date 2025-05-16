// v2 Function
function startSpotAllocation() {
  updateSpotHistory();
  Utilities.sleep(10000);
  archivePreviousSheets();
  archiveAllPingRequests();
  cleanupSpotRequestsSheet();
  cleanupMidWeekSpotsSheet();
  cleanupPollIDs();

  spotAllocationTemplateSheet.copyTo(SpreadsheetApp.getActiveSpreadsheet()).setName("Spot Allocation - Next Week").showSheet().activate();
  SpreadsheetApp.getActiveSpreadsheet().moveActiveSheet(4);

  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Spot Allocation - Last Week").getRange("G21:L27").copyTo(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Spot Allocation - Next Week").getRange("G21:L27"));

  Utilities.sleep(3000);

  updateFormulas();
  removeNonAdminComicsFromWeekdayGroups();

}

function archivePreviousSheets() {
  if (spotAllocationLastWeekSheet) {
    spotAllocationLastWeekSheet.setName(`Spot Allocation - Week ${Utilities.formatDate(new Date(), "IST", "ww") - 1}`).hideSheet();
  }

  if (spotAllocationCurrentWeekSheet) {
    spotAllocationCurrentWeekSheet.setName("Spot Allocation - Last Week").hideSheet();
  }
}

function updateSpotHistory() {
  var lastAllocationDataRow = getLastDataRow(spotAllocationCurrentWeekSheet);
  var foundHistoryRow = -1;

  var comicName, phoneNumber, spotStatus, nextHistoryDataRow, cancelStatus, historyRemarksCell;

  for (let i = 2; i <= lastAllocationDataRow; i++) {
    comicName = spotAllocationCurrentWeekSheet.getRange(`A${i}`).getValue();
    phoneNumber = spotAllocationCurrentWeekSheet.getRange(`B${i}`).getValue();
    spotStatus = spotAllocationCurrentWeekSheet.getRange(`C${i}`).getValue();
    cancelStatus = 0;

    if (spotStatus === "NO SPOT" || spotStatus === "CANNED") {
      continue;
    }

    if (spotStatus === "CANCELLED") {
      spotStatus = spotAllocationCurrentWeekSheet.getRange(`C${i}`).getNote().split(": ")[1];
      cancelStatus = 1;
    }

    foundHistoryRow = searchValues(spotHistorySheet.getRange("A1:B"), comicName, phoneNumber);

    if (foundHistoryRow == -1) {
      nextHistoryDataRow = getLastDataRow(spotHistorySheet, "A") + 1;

      spotHistorySheet.getRange(`A${nextHistoryDataRow}:C${nextHistoryDataRow}`).setValues([[comicName, phoneNumber, getOccurrenceOfDay(spotStatus)]]);

      if (cancelStatus == 1) {
        historyRemarksCell = spotHistorySheet.getRange(`D${nextHistoryDataRow}`);
        historyRemarksCell.setValue(`${(historyRemarksCell.isBlank()) ? "" : historyRemarksCell.getValue() + "\n"}Cancelled Spot For: ${getOccurrenceOfDay(spotStatus)}`)
      }
    } else {
      spotHistorySheet.getRange(`C${foundHistoryRow}`).setValue(getOccurrenceOfDay(spotStatus));

      if (cancelStatus == 1) {
        historyRemarksCell = spotHistorySheet.getRange(`D${foundHistoryRow}`);
        historyRemarksCell.setValue(`${(historyRemarksCell.isBlank()) ? "" : historyRemarksCell.getValue() + "\n"}Cancelled Spot For: ${getOccurrenceOfDay(spotStatus)}`)
      }
    }
  }
}

// v2 Function
function updateFormulas() {
  spotRequestPingsSheet.getRange("D1").setFormula(`=ARRAYFORMULA(IF(A1:A<>"",IF(A1:A = "Ping From","LAST WEEK CHECK?",IF(IFERROR(SEARCH({A1:A},CONCATENATE('Spot Allocation - Last Week'!G2:K8, 'Spot Allocation - Last Week'!G11:K17)),"")<>"","YES","")),""))`);

  currentWeekSheet.getRange("A2").setFormula(`=ARRAYFORMULA(IF('Spot Allocation - Next Week'!G2:K8 = "", "", REGEXEXTRACT('Spot Allocation - Next Week'!G2:K8, "^\\S+")))`);
  currentWeekSheet.getRange("A12").setFormula(`=ARRAYFORMULA(IF('Spot Allocation - Next Week'!G11:K17 = "", "", REGEXEXTRACT('Spot Allocation - Next Week'!G11:K17, "^\\S+")))`);
}

function sendAdminPollsToWeekdayGroups() {

  var whatsappRichResponse = {
    "type": "poll",
    "options": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "title": "Hey Punchlime admins, Please select availability for this week!",
    "count": 0,
  };

  var pollMessage10PM = sendWhatsappMessage(weekday10PMGroupID, "poll", whatsappRichResponse);
  Utilities.sleep(500);
  var pollMessage8PM = sendWhatsappMessage(weekday8PMGroupID, "poll", whatsappRichResponse);
  Utilities.sleep(500);
  PropertiesService.getScriptProperties().setProperty('pollMessage10PMID', pollMessage10PM.message.id);
  PropertiesService.getScriptProperties().setProperty('pollMessage8PMID', pollMessage8PM.message.id);


  sendPOCsPoll();

}

function sendPOCsPoll() {
  var whatsappRichResponse = {
    "type": "poll",
    "options": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "title": "Hey guys, Please share your availability for 8:00 PM POC next week! Thank You.",
    "count": 0,
  };

  sendWhatsappMessage(weekdayPOCsGroupID, "poll", whatsappRichResponse);
  Utilities.sleep(500);
}

function completeCuration() {
  var spotRequestSheetLastRow = getLastDataRow(spotRequestPingsSheet);
  var spotStatusCell, spotTimeCell, notifiedCell, comicName, comicNumber, parameters;

  for (let i = 2; i <= spotRequestSheetLastRow; i++) {
    spotStatusCell = spotRequestPingsSheet.getRange(`G${i}`);
    spotTimeCell = spotRequestPingsSheet.getRange(`H${i}`);
    notifiedCell = spotRequestPingsSheet.getRange(`I${i}`);
    comicName = spotRequestPingsSheet.getRange(`A${i}`).getValue();
    comicNumber = spotRequestPingsSheet.getRange(`B${i}`).getValue();

    if (notifiedCell.isBlank() || !notifiedCell.isChecked()) {
      if (!spotStatusCell.isBlank()) {
        if (spotStatusCell.getValue() === "NO SPOT") {
          sendPostRequestToTwilioFlow(`whatsapp:${comicNumber}`, comicName.split(" ")[0], "no_spot", "no_spot");
        } else {
          parameters = {
            "spotDay": spotStatusCell.getValue(),
            "spotTime": spotTimeCell.getValue()
          };

          sendPostRequestToTwilioFlow(`whatsapp:${comicNumber}`, comicName.split(" ")[0], spotStatusCell.getValue(), "spot_confirmed", parameters);
        }
        notifiedCell.check();
      }
    }
  }

  //(new Date().getDay() == 1) ? dailyCheck(1) : console.log("Not Monday! Skipping dailyCheck().");
  SpreadsheetApp.getActiveSpreadsheet().toast("Notification sent to comics!");
}

// v3 Function
function dailyCheck() {

  const today = new Date().getDay();

  var daysToCheck = "601"; // Won't run on SAT, SUN & MON

  if (daysToCheck.includes(today.toString())) {
    return;
  }

  var dayCodeToday = dayNameMapping[today];

  var allComics = spotAllocationCurrentWeekSheet.getRange("A2:D").getValues();

  var comicsToday = allComics.filter(comic => comic[2] === dayCodeToday);

  var comicDetails = comicsToday.map(comic => {
    return {
      "comicName": comic[0],
      "comicNumber": comic[1],
      "normalizedNumber": normalizePhoneNumber(comic[1]),
      "spotTime": comic[3],
      "message": `Hey ${comic[0].toString().split(" ")[0]}. You have a *${comic[3]}* spot today at *Glens Bakehouse, Koramangala*.\n\nYou shall now be automatically added to the mic group! If you do not get added by evening, please drop a ping to Amrit.\n\n\n_N.B. To make sure you're automatically added to the group, you need to save Amrit's contact._`
    };
  });

  var comicsToAdd8PM = comicDetails.filter(comic => comic.spotTime === "8:00 PM").map(comic => comic.normalizedNumber);
  var comicsToAdd10PM = comicDetails.filter(comic => comic.spotTime === "10:00 PM").map(comic => comic.normalizedNumber);

  removeNonAdminComicsFromWeekdayGroups();


  console.log("Comics to ADD for 8PM: " + comicsToAdd8PM);
  (comicsToAdd8PM.length > 0) ? manageWhatsappGroup(weekday8PMGroupID, comicsToAdd8PM, "add") : console.log("No one to add!");
  Utilities.sleep(500);

  console.log("Comics to ADD for 10PM: " + comicsToAdd10PM);
  (comicsToAdd10PM.length > 0) ? manageWhatsappGroup(weekday10PMGroupID, comicsToAdd10PM, "add") : console.log("No one to add!");
  Utilities.sleep(500);

  console.log("Added Comics To Weekday Mic Groups!");

  postTodaysLineup(dayCodeToday, "8PM", 1, 0);
  Utilities.sleep(500);
  postTodaysLineup(dayCodeToday, '10PM', 1, 0);

  console.log("Posted BMS Link to Group!");

  
  /**
  comicDetails.forEach(comic => {
    sendPostRequestToTwilioFlow(`whatsapp:${comic.comicNumber}`, comic.comicName, comic.message, "send_message");
  });

  console.log("Sent Spot Update Notification To Comics!");

  */

}

function updateMONlineup() {

  var comicsMON = spotAllocationCurrentWeekSheet.getRange("A2:D").getValues().filter(comic => comic[2] === "MON");
  var mon10PMComicsToAdd = comicsMON.filter(time => time[3] === "10:00 PM").map(spot => normalizePhoneNumber(spot[1]));
  var mon8PMComicsToAdd = comicsMON.filter(time => time[3] === "8:00 PM").map(spot => normalizePhoneNumber(spot[1]));

  var comicDetails = comicsMON.map(comic => {
    return {
      "comicName": comic[0],
      "comicNumber": comic[1],
      "spotTime": comic[3],
      "message": `Hey ${comic[0]}. You have a *${comic[3]}* spot today at *Glens Bakehouse, Koramangala*.\n\nKindly proceed with the self-service and get yourself added to the group: ${(comic[3].includes("8") ? whatsapp8PMGroupLink : whatsapp10PMGroupLink)}\n\n\nN.B. To make sure you're automatically added to the group, you need to save Amrit's contact.`
    };
  });

  console.log("8PM - " + mon8PMComicsToAdd);
  console.log("10PM - " + mon10PMComicsToAdd);  

  (mon10PMComicsToAdd && mon10PMComicsToAdd.length > 0) ? manageWhatsappGroup(weekday10PMGroupID, mon10PMComicsToAdd, "add") : console.log("No one to add!");
  Utilities.sleep(2000);
  (mon8PMComicsToAdd && mon8PMComicsToAdd.length > 0) ? manageWhatsappGroup(weekday8PMGroupID, mon8PMComicsToAdd, "add") : console.log("No one to add!");
  Utilities.sleep(2000);

  console.log("Added Monday Comics To Weekday Mic Groups!");

  postTodaysLineup("MON", "8PM", 1, 0);
  Utilities.sleep(500);
  postTodaysLineup("MON", "10PM", 1, 0);

  console.log("Posted BMS Link to Group!");

  /**
  comicDetails.forEach(comic => {
    sendPostRequestToTwilioFlow(`whatsapp:${comic.comicNumber}`, comic.comicName, comic.message, "send_message");
  })

  SpreadsheetApp.getActiveSpreadsheet().toast("Notification sent to comics on Monday lineup!");
  */

  Utilities.sleep(2000);
  archiveAllPingRequests();
  SpreadsheetApp.getActiveSpreadsheet().toast("Archived All-Ping Rows...");
}

function check10PMPoll() {
  var pollMessageID = PropertiesService.getScriptProperties().getProperty("pollMessage10PMID");

  if (!pollMessageID) {
    console.log("No Poll ID Found.");
    return;
  }

  var pollResults = getWhatsappMessage(pollMessageID);

  if (pollResults.code == 400) {
    console.log("Poll Not Found");
  } else {
    var pollDay, voters, lineupForTheDayRange, lineupForTheDay;

    pollResults.poll.results.forEach(poll => {
      pollDay = poll.name.substring(0, 3).toUpperCase();
      voters = poll.voters.map(voter => searchContactByPhoneNumber(voter.split("@")[0]).split(" ")[0]);

      lineupForTheDayRange = spotAllocationCurrentWeekSheet.getRange(11, dayColumnMapping[pollDay], 7);
      lineupForTheDay = lineupForTheDayRange.getValues().map(comic => comic[0]).filter(blank => blank !== '');

      adminList.forEach(admin => {
        if (!voters.includes(admin) && lineupForTheDay.includes(admin)) {
          findAndDelValueInRange(lineupForTheDayRange, admin);
        } else if (voters.includes(admin) && !lineupForTheDay.includes(admin)) {
          fillInNextBlank(pollDay, "10:00 PM", admin, spotAllocationCurrentWeekSheet);
        }
      });
    });

  }
}

function check8PMPoll() {
  var pollMessageID = PropertiesService.getScriptProperties().getProperty("pollMessage8PMID");

  if (!pollMessageID) {
    console.log("No Poll ID Found.");
    return;
  }

  var pollResults = getWhatsappMessage(pollMessageID);

  if (pollResults.code == 400) {
    console.log("Poll Not Found");
  } else {
    var pollDay, voters, lineupForTheDayRange, lineupForTheDay;

    console.log(pollResults);

    pollResults.poll.results.forEach(poll => {
      pollDay = poll.name.substring(0, 3).toUpperCase();
      voters = poll.voters.map(voter => searchContactByPhoneNumber(voter.split("@")[0]).split(" ")[0]);

      lineupForTheDayRange = spotAllocationCurrentWeekSheet.getRange(2, dayColumnMapping[pollDay], 7);
      lineupForTheDay = lineupForTheDayRange.getValues().map(comic => comic[0]).filter(blank => blank !== '');

      adminList.forEach(admin => {
        if (!voters.includes(admin) && lineupForTheDay.includes(admin)) {
          findAndDelValueInRange(lineupForTheDayRange, admin);
        } else if (voters.includes(admin) && !lineupForTheDay.includes(admin)) {
          fillInNextBlank(pollDay, "8:00 PM", admin, spotAllocationCurrentWeekSheet);
        }
      });
    });

  }
}

function cancelMySpot(pingDetails) {
  pingDetails.reasonCode = "CR";
  pingDetails.statusCode = 200;

  var foundThisWeekRow = searchValues(spotAllocationCurrentWeekSheet.getRange("A1:B"), pingDetails.contactName, pingDetails.formattedNumber);

  if (foundThisWeekRow == -1) {
    pingDetails.customResponse = `Sorry ${pingDetails.firstName}. You do not have a spot this week...\nI cannot cancel hypothetical spots yet!`;

  } else {
    var spotStatus = spotAllocationCurrentWeekSheet.getRange(`C${foundThisWeekRow}`);
    var spotTime = spotAllocationCurrentWeekSheet.getRange(`D${foundThisWeekRow}`);

    if (spotStatus.isBlank()) {
      pingDetails.customResponse = "Spots for the week have not been allocated yet... Please wait for spot confirmation as I cannot cancel hypothetical spots yet!";
    } else if (spotStatus.getValue() === "NO SPOT") {
      pingDetails.customResponse = `Sorry ${pingDetails.firstName}. You do not have a spot this week...\nI cannot cancel hypothetical spots yet!`;
    } else if (spotStatus.getValue() === "CANCELLED") {
      pingDetails.customResponse = `Sorry ${pingDetails.firstName}. You have already cancelled your spot for this week...\nThere's nothing for me to do now!`;
    } else if (spotStatus.getValue() === "CANNED") {
      pingDetails.customResponse = `Sorry ${pingDetails.firstName}. The mic you were on, got canned this week...\nThere's nothing for me to do now!`;
    } else {
      var comicName = spotAllocationCurrentWeekSheet.getRange(`A${foundThisWeekRow}`);
      var comicNumber = spotAllocationCurrentWeekSheet.getRange(`B${foundThisWeekRow}`);

      var parameters = {
        "comicName": comicName.getValue(),
        "spotTime": spotTime.getValue(),
        "spotDay": spotStatus.getValue()
      };

      pingDetails.customResponse = `Okay ${pingDetails.firstName}. I'm cancelling your spot at Glens for ${spotStatus.getValue()}, ${spotTime.getValue()}.\n\nSee ya next time! 🫡`;

      var todayDay = dayNameMapping[new Date().getDay()];

      if (todayDay === spotStatus.getValue()) {
        console.log("Trying to Delete");
        console.log([normalizePhoneNumber(comicNumber.getValue())]);

        manageWhatsappGroup((spotTime.getValue().toString().includes("8") ? weekday8PMGroupID : weekday10PMGroupID), [normalizePhoneNumber(comicNumber.getValue())], "delete");
        Utilities.sleep(500);
      }


      if (spotTime.getValue() === "8:00 PM") {
        findAndDelValueInRange(spotAllocationCurrentWeekSheet.getRange(2, dayColumnMapping[spotStatus.getValue()], 7), comicName.getValue());
      } else if (spotTime.getValue() === "10:00 PM") {
        findAndDelValueInRange(spotAllocationCurrentWeekSheet.getRange(11, dayColumnMapping[spotStatus.getValue()], 7), comicName.getValue());
      }

      spotStatus.setNote(`Had Spot On: ${spotStatus.getValue()}`).setValue("CANCELLED");
      spotTime.clearContent();

      sendPostRequestToTwilioFlow(`whatsapp:+917978416962`, "Amrit", "cancel_spot", "cancel_spot", parameters);
    }
  }

  updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  return pingDetails;
}


// Page Testing Function
function test2() {
  //console.log();


  console.log();
}