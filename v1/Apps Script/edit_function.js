function allocateSpotsOnEdit(e) {
  var sheetName = e.source.getSheetName();

  var editedCell = e.range;
  var editedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  var name = editedSheet.getRange(editedCell.getRow(), 1).getValue();
  var number = editedSheet.getRange(editedCell.getRow(), 2).getValue();
  var spotDay = editedSheet.getRange(editedCell.getRow(), 3);
  var spotTime = editedSheet.getRange(editedCell.getRow(), 4);

  if (sheetName.includes("Spot Allocation -")) {

    // Check for the update of time in column D    
    if (editedCell.getColumn() == 4 && editedCell.getRow() > 1) {
    
      if (e.oldValue) {
        if (e.oldValue === "8:00 PM") {
          findAndDelValueInRange(editedSheet.getRange("G2:K8"), name);
        } else if (e.oldValue === "10:00 PM") {
          findAndDelValueInRange(editedSheet.getRange("G11:K17"), name);
        }
        updateNotificationCheckbox(name, number, editedCell.getRow(), spotDay, 0);
      }

      if (spotDay.isBlank()) {
        console.log("Spot day is not mentioned.");
        return;
      }

      var updateToLineup = fillInNextBlank(spotDay.getValue(), spotTime.getValue(), name, editedSheet);
      if (updateToLineup == 0) {
        editedCell.clearContent();
        return;
      }

    } else if (editedCell.getColumn() == 3 && editedCell.getRow() > 1) {

      if (editedCell.getValue() === "NO SPOT") {
        if (spotTime.getValue() === "8:00 PM") {
          findAndDelValueInRange(editedSheet.getRange("G2:K8"), name);
        } else if (spotTime.getValue() === "10:00 PM") {
          findAndDelValueInRange(editedSheet.getRange("G11:K17"), name);
        }
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
        if (spotTime.getValue() === "8:00 PM") {
          findAndDelValueInRange(editedSheet.getRange("G2:K8"), name);
        } else if (spotTime.getValue() === "10:00 PM") {
          findAndDelValueInRange(editedSheet.getRange("G11:K17"), name);
        }
        spotTime.clearContent();
        return;
      }

      if (e.oldValue) {
        if (spotTime.getValue() === "8:00 PM") {
          findAndDelValueInRange(editedSheet.getRange("G2:K8"), name);
        } else if (spotTime.getValue() === "10:00 PM") {
          findAndDelValueInRange(editedSheet.getRange("G11:K17"), name);
        }
        spotTime.clearContent();
        updateNotificationCheckbox(name, number, editedCell.getRow(), spotDay, 0);
      }

      if (spotTime.isBlank()) {        
        console.log("Spot time is not mentioned.");
        return;
      }

      var updateToLineup = fillInNextBlank(spotDay.getValue(), spotTime.getValue(), name, editedSheet);
      if (updateToLineup == 0) {
        editedCell.clearContent();
        return;
      }

    }
  } else if (sheetName.includes("Amrit's Spots -")) {
    var spotCountCell = editedSheet.getRange("J8");
    var allSpotsRange = editedSheet.getRange("B3:H18");

    var allSpotsCount = allSpotsRange.getValues().join(",").split(",").filter(spot => spot !== "").length;
    var cancelledSpotsCount = cancelledSpotCounter(allSpotsRange);

    spotCountCell.setValue(allSpotsCount - cancelledSpotsCount);
  }
}

function cancelledSpotCounter(inputRange) {

  var strikeThroughCount = 0;

  // Loop through each cell in the input array
  var numRows = inputRange.getValues().length;
  var numCols = inputRange.getValues()[0].length;

  for (var i = 1; i <= numRows; i++) {
    for (var j = 1; j <= numCols; j++) {
      var cell = inputRange.getCell(i, j); // Get the cell at the current index
      var textStyle = cell.getTextStyle(); // Get the text style

      // Check if the cell has strikethrough formatting
      if (textStyle && textStyle.isStrikethrough()) {
        strikeThroughCount++;
      }
    }
  }

  return strikeThroughCount;
}
