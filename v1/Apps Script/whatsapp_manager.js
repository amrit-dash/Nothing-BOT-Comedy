function doPost(e) {
  var data = {};

  if (e.parameter.action) {
    if (e.parameter.action === "newPing") {
      data = registerNewPing(e.parameter);
    } else if (e.parameter.action === "saveNewContact") {
      saveNewContact(e.parameter);
    } else if (e.parameter.action === "updateSpotPreferences") {
      updateSpotPreferences(e.parameter);
    } else if (e.parameter.action === "micUpdate") {
      micUpdate(e.parameter);
    } else if (e.parameter.action === "adHocSpotUpdate") {
      adHocSpotUpdate(e.parameter);
    } else if (e.parameter.action === "clearSpotRequest") {
      clearSpotRequest(e.parameter);
    } //else if (e.parameter.action === "cancelSpot") {
    //cancelMySpot(e.parameter.pingDetails);
    //}
  }

  return data;
}

function registerNewPing(pingDetails) {

  var nextDataRow = getLastDataRow(allPingsSheet, "A") + 1;
  var fromNumber = pingDetails.from.split(":")[1];
  var body = pingDetails.body;
  var whatsappProfileName = (pingDetails.waProfileName) ? pingDetails.waProfileName : "NA";

  var contactName = searchContactByPhoneNumber(fromNumber);

  if (contactName === "NA") {
    var searchNewContactSheet = searchValues(newContactsSheet.getRange("B1:C"), fromNumber, whatsappProfileName);
    if (searchNewContactSheet == -1) {
      var lookupInGoogleContacts = findContact(fromNumber, "phone");
      if (lookupInGoogleContacts === "NA") {
        contactName = pingDetails.from;
      } else {
        contactName = lookupInGoogleContacts;
      }
    } else {
      contactName = newContactsSheet.getRange(`A${searchNewContactSheet}`).getValue();
    }
  }

  pingDetails.contactName = contactName;
  pingDetails.pingRowNumber = nextDataRow;
  pingDetails.formattedNumber = fromNumber;

  var firstName = (contactName.toLowerCase().includes("whatsapp")) ? "buddy" : contactName.split(" ")[0].trim();
  pingDetails.firstName = firstName;

  allPingsSheet.getRange(`A${nextDataRow}`).setValue(contactName);
  allPingsSheet.getRange(`B${nextDataRow}`).setValue(fromNumber);
  allPingsSheet.getRange(`C${nextDataRow}`).setValue(body);
  allPingsSheet.getRange(`E${nextDataRow}`).setValue("hover").setNote(`Received On:\n\n${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "hh:mm a, dd-MMM-yyyy, EEEE")}`);

  var output = checkNewPing(pingDetails);
  return output;
}

function checkNewPing(pingDetails) {
  if (pingDetails.firstName === "buddy") {
    pingDetails.reasonCode = "NC";
    pingDetails.statusCode = 203;

    updateRemarks(pingDetails.pingRowNumber, "New Contact Flow Triggered");
    return createJsonOutput(pingDetails);
  }

  var customResponse = checkCustomResponse(pingDetails);

  console.log(customResponse);

  if (customResponse !== "NA") {

    return customResponse;

  } else if (pingDetails.body.toLowerCase().includes("spot") || pingDetails.body.toLowerCase().includes("slot")) {

    return createSpotRequest(pingDetails);

  } else {

    pingDetails.reasonCode = "NP";
    pingDetails.statusCode = 201;

    updateRemarks(pingDetails.pingRowNumber, "Non Spot Message");
    return createJsonOutput(pingDetails);

  }

}

function sendCustomMessage() {
  var ui = SpreadsheetApp.getUi();
  var getName = ui.prompt("Who do you want to ping?", "Enter name of person to search.", ui.ButtonSet.OK_CANCEL);

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

        var message = ui.prompt("Enter the message:", `This message will be sent to ${name} from Spot Manager Bot.`, ui.ButtonSet.OK).getResponseText();

        var send = sendPostRequestToTwilioFlow(sendTo, name.split(" ")[0], message, "send_message");

        if (send == 1) {
          SpreadsheetApp.getActiveSpreadsheet().toast("Message Sent!");
        } else {
          SpreadsheetApp.getActiveSpreadsheet().toast("Could not send message!\n\nTry Again...");
          return;
        }
      } else {
        SpreadsheetApp.getActiveSpreadsheet().toast("Incorrect contact found!\n\nTry Again...");
        return;
      }

    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast("Did not find any matched contact!\n\nTry Again...")
    }
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast("Cancelled!");
    return;
  }
}

function sendPostRequestToTwilioFlow(sendTo, name, message, action, parameters = {}) {
  // Twilio Flow details
  const flowSid = config.TWILIO.FLOW_SID;

  //LIVE
  const accountSid = config.TWILIO.ACCOUNT_SID;
  const authToken = config.TWILIO.AUTH_TOKEN;
  const twilioNumber = config.TWILIO.PHONE_NUMBER;

  //TEST
  //const accountSid = config.TWILIO.TEST_ACCOUNT_SID;
  //const authToken = config.TWILIO.TEST_AUTH_TOKEN;
  //const twilioNumber = config.TWILIO.TEST_PHONE_NUMBER;

  // URL for the Twilio Flow POST request
  const url = `https://studio.twilio.com/v2/Flows/${flowSid}/Executions`;

  // Data to send in the POST request
  const data = {
    To: sendTo, // Replace with the phone number you want to send the flow to
    From: twilioNumber, // Replace with your Twilio phone number
    Parameters: JSON.stringify({
      action: action,
      name: name,
      message: message,
      parameters: parameters
    })
  };

  // Setting up options for the POST request
  const options = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(accountSid + ":" + authToken),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    payload: data
  };

  try {
    // Send the POST request
    var response = UrlFetchApp.fetch(url, options);
    return (JSON.parse(response).status === "active") ? 1 : 0;
  } catch (e) {
    console.log(e);
    return 0;
  }
}

function getWhatsappGroup(groupID) {
  var url = `https://gate.whapi.cloud/groups/${groupID}`;

  // Set up the request headers
  var headers = {
    "Authorization": "Bearer " + config.WHAPI.TOKEN,
    "Content-Type": "application/json"
  };

  // Request options
  var options = {
    "method": "GET",  // Use "POST", "PUT", etc. based on your API requirements
    "headers": headers,
    "muteHttpExceptions": true  // Allows you to capture errors from the API response
  };

  try {
    // Make the API call
    var response = UrlFetchApp.fetch(url, options);

    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log("Error making API call: " + error);
  }
}

function getWhatsappGroupInviteCode(groupID) {
  var url = `https://gate.whapi.cloud/groups/${groupID}/invite`;  // Replace with your API endpoint

  // Set up the request headers
  var headers = {
    "Authorization": "Bearer " + WHAPI_TOKEN,
    "Content-Type": "application/json"  // Adjust the content type if necessary
  };

  // Request options
  var options = {
    "method": "GET",  // Use "POST", "PUT", etc. based on your API requirements
    "headers": headers,
    "muteHttpExceptions": true  // Allows you to capture errors from the API response
  };

  try {
    // Make the API call
    var response = UrlFetchApp.fetch(url, options);

    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log("Error making API call: " + error);
  }
}

function addToGroupByInviteCode(comicNumber, inviteCode) {
  var url = `https://gate.whapi.cloud/groups/link/${inviteCode}`;  // Replace with your API endpoint

  // Set up the request headers
  var headers = {
    "Authorization": "Bearer " + WHAPI_TOKEN,
    "Content-Type": "application/json"  // Adjust the content type if necessary
  };

  var payload = {
    "to": comicNumber,
    "body": "Please accept the invite and get yourself added to the group for today's mic!"
  };

  // Request options
  var options = {
    "method": "POST",  // Use "POST", "PUT", etc. based on your API requirements
    "headers": headers,
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true  // Allows you to capture errors from the API response
  };

  try {
    // Make the API call
    var response = UrlFetchApp.fetch(url, options);

    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log("Error making API call: " + error);
  }
}

function getWhatsappMessage(messageID) {
  var url = `https://gate.whapi.cloud/messages/${messageID}`;  // Replace with your API endpoint

  // Set up the request headers
  var headers = {
    "Authorization": "Bearer " + WHAPI_TOKEN,
    "Content-Type": "application/json"  // Adjust the content type if necessary
  };

  // Request options
  var options = {
    "method": "GET",  // Use "POST", "PUT", etc. based on your API requirements
    "headers": headers,
    "muteHttpExceptions": true  // Allows you to capture errors from the API response
  };

  try {
    // Make the API call
    var response = UrlFetchApp.fetch(url, options);

    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log("Error making API call: " + error);
  }
}

function manageWhatsappGroup(groupID, participantList, action) {
  var url = `https://gate.whapi.cloud/groups/${groupID}/participants`;  // Replace with your API endpoint

  // Set up the request headers
  var headers = {
    "Authorization": "Bearer " + WHAPI_TOKEN,
    "Content-Type": "application/json"  // Adjust the content type if necessary
  };

  // Payload with array of strings
  var payload = {
    "participants": participantList  // The key 'data' will contain the array in the request body
  };

  var method = (action === "delete") ? "DELETE" : "POST";

  // Request options
  var options = {
    "method": method,
    "headers": headers,
    "payload": JSON.stringify(payload),  // Convert payload (including array) to JSON
    "muteHttpExceptions": true  // Allows you to capture errors from the API response
  };

  try {
    // Make the API call
    var response = UrlFetchApp.fetch(url, options); 
    
    if (action === "add") {
      var failCheck = (JSON.parse(response.getContentText()).failed) ? JSON.parse(response.getContentText()).failed : [];

      if (failCheck.length == 0) {
      console.log("All Processed");
      return "OK";
      }

      console.log(`All Processed. Some comics need to be invited manually.`);
      var groupDetail = getWhatsappGroup(groupID);
      var comicsInTheGroups = groupDetail.participants.filter(comic => !"creator_admin".includes(comic.rank)).map(comic => comic.id);

      var comicName;

      failCheck.forEach(failedToAdd => {
        if (!comicsInTheGroups.includes(failedToAdd)) {
        
          comicName = findContact(failedToAdd, "phone")[0];
          sendWhatsappMessage(PUNCHLIME_CLUB_GROUP_ID, `*Hey admins of the group - ${groupDetail.name}.*\nUnable to add contact to the group. Someone needs to manually invite them to the group by evening if Amrit misses this alert!\n\n*Failed Contact :*\n${comicName} - ${failedToAdd}\n*Group Name :* ${groupDetail.name}\n\n_P.S. This is an automated message._`);
          sendWhatsappMessage(ADMIN_PHONE_NUMBER, `*⚠️ Alert from group - ${groupDetail.name}.*\n\nUnable to add contact to the group. Please invite them manually!\n\n*Failed Contact :*\n${comicName} - ${failedToAdd}\n*Group Name :* ${groupDetail.name}`)
        }
      });
    }

    return "OK";

  } catch (error) {
    Logger.log("Error making API call: " + error);
    return "404";
  }
}

function sendWhatsappMessage(to, text, richText = "NA") {
  var url = `https://gate.whapi.cloud/messages/text`;  // Replace with your API endpoint

  // Set up the request headers
  var headers = {
    "Authorization": "Bearer " + WHAPI_TOKEN,
    "Content-Type": "application/json"  // Adjust the content type if necessary
  };

  var payload = {
    "to": to.toString(),
    "body": text.toString()
  };

  if (richText.type === "poll") {
    url = "https://gate.whapi.cloud/messages/poll";

    payload = {
      "to": to.toString(),
      "title": richText.title,
      "options": richText.options,
      "count": richText.count
    };
  }

  // Request options
  var options = {
    "method": "POST",
    "headers": headers,
    "payload": JSON.stringify(payload),  // Convert payload (including array) to JSON
    "muteHttpExceptions": true  // Allows you to capture errors from the API response
  };

  try {
    // Make the API call
    var response = UrlFetchApp.fetch(url, options);
    //Logger.log(response);

    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log("Error making API call: " + error);
  }
}



// Page Testing Function
function test() {
  //console.log();


  var url = `https://gate.whapi.cloud/groups/${WEEKDAY_10PM_GROUP_ID}`;  // Replace with your API endpoint

  // Set up the request headers
  var headers = {
    "Authorization": "Bearer " + WHAPI_TOKEN,
    "Content-Type": "application/json"  // Adjust the content type if necessary
  };

  // Request options
  var options = {
    "method": "GET",  // Use "POST", "PUT", etc. based on your API requirements
    "headers": headers,
    "muteHttpExceptions": true  // Allows you to capture errors from the API response
  };

  try {
    // Make the API call
    var response = UrlFetchApp.fetch(url, options);

    console.log(JSON.parse(response.getContentText()));
  } catch (error) {
    Logger.log("Error making API call: " + error);
  }

  console.log();
}