var pocList = [
  "Kush",
  "Ruchi",
  "Minhaj",
  "Rohan Khilnani",
  "Prathyusha",
  "Nick",
];

var banList = [
  "Pushkin Dahiya",
  "Lakshit Comic BLR - New"
];

var ignoreList = [
  "Ignored Comic 1",
  "Ignored Comic 2"
];

var adminList = [
  "Amrit",
  "Samarpan",
  "Aman",
  "Mohit"
];

// Define the day-to-column mapping
var dayColumnMapping = {
  "MON": 7, // Column G
  "TUE": 8, // Column H
  "WED": 9, // Column I
  "THU": 10, // Column J
  "FRI": 11 // Column K
};

// Define the day-to-dayName mapping
var dayNameMapping = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT"
};


function checkDay() {

  if (overrideMidWeekRequestValue === "YES") {
    return "VALID";
  }

  const today = new Date();
  const scriptTimeZone = Session.getScriptTimeZone();
  const istDate = Utilities.formatDate(today, scriptTimeZone, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const istHour = parseInt(istDate.split("T")[1].split(":")[0]);
  const dayOfWeek = new Date().getDay();

  if ("601".includes(dayOfWeek)) {
    if (dayOfWeek == 1) {
      if (istHour >= 10) {
        return "INVALID";
      }
    } else if (dayOfWeek == 6) {
      if (istHour <= 15) {
        return "INVALID";
      }
    }
    return "VALID";
  } else {
    return "INVALID";
  }
}

function checkPOC(nameOfComic) {
  var pocCheck = "NO";

  pocList.forEach(poc => {
    if (nameOfComic.includes(poc)) {
      pocCheck = "YES";
    }
  });

  return pocCheck;
}

function checkBan(nameOfComic) {
  var banCheck = "NO";

  banList.forEach(comic => {
    if (nameOfComic.includes(comic)) {
      banCheck = "YES";
    }
  });

  return banCheck;
}

function ignoreListCheck(nameOfComic) {
  var ignoreListCheck = "NO";

  ignoreList.forEach(comic => {
    if (nameOfComic.includes(comic)) {
      ignoreListCheck = "YES";
    }
  });

  return ignoreListCheck;
}

// v2 Function
function duplicateSpotCheck(pingDetails) {
  var entryExistsCheck = searchValues(spotAllocationCurrentWeekSheet.getRange("A1:B"), pingDetails.contactName, pingDetails.formattedNumber);

  if (entryExistsCheck != -1) {
    var preferenceCell = spotAllocationCurrentWeekSheet.getRange(`E${entryExistsCheck}`);
    var allocationCell = spotAllocationCurrentWeekSheet.getRange(`C${entryExistsCheck}`);
    var allocationTimeCell = spotAllocationCurrentWeekSheet.getRange(`D${entryExistsCheck}`);

    if (preferenceCell.isBlank()) {
      var lastSpotFormula = `=IFERROR( CONCATENATE("Last Spot at Glens: ", DAYS(TODAY(), VLOOKUP(B${entryExistsCheck}, 'Spot History'!$B$1:$C, 2, FALSE)), " days ago."), "No recorded last spot!")`;

      preferenceCell.setFormula(lastSpotFormula);
    }

    if (!allocationCell.isBlank() && !allocationTimeCell.isBlank()) {
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

// v2 Function
function checkCustomResponse(pingDetails) {
  var messageText = pingDetails.body;
  var output;

  console.log(messageText);
// remove
  if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*who.*are.*you.*/)) {
    pingDetails.reasonCode = "NP";
    pingDetails.statusCode = 200;
    pingDetails.body = "who_am_i";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", "Who am I Template");
  } 
  // remove
  else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*what.*can.*you.*do.*/) || messageText.toLowerCase().match(/.*main.*menu.*/) || messageText.toLowerCase().match(/.*help.*me.*/)) {
    pingDetails.reasonCode = "NP";
    pingDetails.statusCode = 200;
    pingDetails.body = "main_menu";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", "Main Menu Template");
  } else if (messageText.toLowerCase().match(/.*cancel.*spot.*/) || messageText.toLowerCase().match(/.*i.*back.*out.*/) || messageText.toLowerCase().match(/.*by.*mistake.*/) || messageText.toLowerCase().match(/.*cancel.*request.*/)) {

    //pingDetails.reasonCode = "CS";
    //pingDetails.statusCode = 204;

    //updateRemarks(pingDetails.pingRowNumber, "Spot Cancellation Initiated");

    pingDetails = cancelMySpot(pingDetails);

  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*all.*feature.*/) || messageText.toLowerCase().match(/.*feature.*list.*/) || messageText.toLowerCase().match(/.*feature*/)) {
    pingDetails.reasonCode = "NP";
    pingDetails.statusCode = 200;
    pingDetails.body = "all_features";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", "Features Page 1");
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*page.*2.*/)) {
    pingDetails.reasonCode = "NP";
    pingDetails.statusCode = 200;
    pingDetails.body = "page_2";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", "Features Page 2");
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*when.*does.*happen.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Weekday mics at Glens happens on Monday to Friday, both at 8:00 PM and 10:00 PM.";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*where.*glen.*/) || messageText.toLowerCase().match(/.*how.*to.*reach.*glen.*/) || messageText.toLowerCase().match(/.*where.*happen.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "This mic happens at Glens Bakehouse, Koramangala.\n\nGoogle Maps: https://maps.app.goo.gl/dXnzYav9uw5UfsmH8";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*amrit.*contact.*/) || messageText.toLowerCase().match(/.*amrit.*number.*/) || messageText.toLowerCase().match(/.*contact.*amrit.*/) || messageText.toLowerCase().match(/.*know.*amrit.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Hmm! I thought we had a thing going on, but you had to get the ~big~ guy involved... 🫠\n\nAnyways, you can say 'Hi' to Amrit here: https://wa.me/917978416962?text=Hi%20Amrit.";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if (messageText.toLowerCase().match(/.*update.*preference.*/) || messageText.toLowerCase().match(/.*update.*my.*preference.*/) || messageText.toLowerCase().match(/.*change.*preference.*/) || messageText.toLowerCase().match(/.*have.*preference.*/)) {

    if (duplicateSpotCheck(pingDetails) === "NO") {
      pingDetails.reasonCode = "CR";
      pingDetails.statusCode = 200;

      pingDetails.customResponse = "Hey! You do not have a spot this week. I cannot update hypothetical preferences...\n\nBut ya, who knows, maybe in the next update! 🫡";

    } else if (duplicateSpotCheck(pingDetails) === "NO_PREFERENCE") {
      pingDetails.reasonCode = "DS BP";
      pingDetails.statusCode = 200;

      pingDetails.customResponse = "Spot Request Exists with Blank Preference.\nTriggered 'Ask Preference' Flow.";
      
    } else {
      pingDetails.reasonCode = "CR";
      pingDetails.statusCode = 200;

      pingDetails.customResponse = "I don't do that yet cause free will, to me, is a myth! xD\n\nBut don't worry, this feature is being worked on as we speak... Maybe in the next update! 🫡";
      
    }

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*change.*spot.*/) || messageText.toLowerCase().match(/.*change.*my.*spot.*/) || messageText.toLowerCase().match(/.*shift.*spot.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "I can't move your spots around yet! For that, you'd have to reach out to Amrit for now.\n\nBut don't worry, this feature is being worked on as we speak... Maybe in the next update! 🫡";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*last.*time.*/) || messageText.toLowerCase().match(/.*last.*spot.*at.*glen.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;

    var foundHistoryRow = searchValues(spotHistorySheet.getRange("A1:B"), pingDetails.contactName, pingDetails.formattedNumber);

    pingDetails.customResponse = (foundHistoryRow == -1) ? "I have no records of the last time you did a spot at Glens. Will update after next spot." : `Your last spot at Glens was on ${spotHistorySheet.getRange(`C${foundHistoryRow}`).getValue()}.`;

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*up.*this.*week.*\?.*/) || messageText.toLowerCase().match(/.*have.*this.*week.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;

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
        pingDetails.customResponse = `This week, you're up on ${spotStatus.getValue()}, ${spotTime.getValue()}.`;
      }
    }

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*pizza.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Hey-yo, It's not *Dominos* this side! 🍕";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*sandwich.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Did you try pinging *Zomato* instead? 🥪";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*burger.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Knight to D3. And checkmate *Burger King*. 🍔";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*thank[s]{0,1}.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "You're most welcome!";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if (messageText.toLowerCase().match(/.*yep.*book me.*/)) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "Sorry. The spot is no longer available!";

    updateRemarks(pingDetails.pingRowNumber, "Request Expired");
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && ["okay", "ok", "👍", "got it", "gotcha", "yes", "yeah", "no", "nope", "bot", "🫡"].some(substring => messageText.toLowerCase().includes(substring))) {
    pingDetails.reasonCode = "CR";
    pingDetails.statusCode = 200;
    pingDetails.customResponse = "🫡";

    updateRemarks(pingDetails.pingRowNumber, "Custom Response", pingDetails.customResponse);
  } else if ((pingDetails.formattedNumber.toString().includes("7978416962") || pingDetails.formattedNumber.toString().includes("84654957")) && messageText.toLowerCase().match(/.*admin.*/)) {
    pingDetails.reasonCode = "CR AF";
    pingDetails.statusCode = 200;

    if (messageText.toLowerCase().match(/.*mic.*check.*/)) {
      var now = new Date();
      var twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000); 
      ScriptApp.newTrigger("micCheck").timeBased().at(twoMinutesFromNow).create();
      pingDetails.customResponse = "Trigger Scheduled For Admin Function: *Mic_Check*";
    }

    updateRemarks(pingDetails.pingRowNumber, "Admin Function Triggered", pingDetails.customResponse);
  } else {
    return "NA";
  }

  output = createJsonOutput(pingDetails);
  return output;
}

function micCheck() {
  const today = new Date().getDay();
  if ("01".includes(today.toString())) {
    return;
  }

  sendPostRequestToTwilioFlow(`whatsapp:+917978416962`, "Amrit", "mic_check", "mic_check");
}

// v2 Function
function micUpdate(parameters) {
  const yesterday = new Date().getDay() - 1;
  var status10PM = parameters.status10PM;
  var status8PM = parameters.status8PM;

  var dayName = dayNameMapping[yesterday];

  if (status8PM.toLowerCase().includes("no") || status8PM.toLowerCase().includes("didnt happen")) {
    spotAllocationCurrentWeekSheet.getRange(2, dayColumnMapping[dayName], 7).clearContent();
    findAndChangeValueBasedOnCriteria(spotAllocationCurrentWeekSheet.getRange("C2:D"), "8:00 PM", dayName, "CANNED");
  }

  if (status10PM.toLowerCase().includes("no") || status10PM.toLowerCase().includes("didnt happen")) {
    spotAllocationCurrentWeekSheet.getRange(11, dayColumnMapping[dayName], 7).clearContent();
    findAndChangeValueBasedOnCriteria(spotAllocationCurrentWeekSheet.getRange("C2:D"), "10:00 PM", dayName, "CANNED");
  }


}