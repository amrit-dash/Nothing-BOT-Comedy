function updateSpotsForAmrit() {

  if (mySpotsSheetLastWeek) {
    mySpotsSheetLastWeek.setName(`Amrit's Spots - Week ${Utilities.formatDate(new Date(), "IST", "ww") - 1}`).hideSheet();
  }

  if (mySpotsSheetThisWeek) {
    mySpotsSheetThisWeek.setName("Amrit's Spots - Last Week").hideSheet();
  }

  mySpotsSheetTemplate.copyTo(SpreadsheetApp.getActiveSpreadsheet()).setName("Amrit's Spots - This Week").showSheet().activate();

  SpreadsheetApp.getActiveSpreadsheet().moveActiveSheet(newContactsSheet.getIndex() + 1);

}