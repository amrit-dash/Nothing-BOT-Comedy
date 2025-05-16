import { db } from '../config/firebase';
import { SheetsService } from '../services/sheets.service';

const sheetsService = new SheetsService();

/**
 * Sync spots from Firestore to Google Sheets
 */
export async function syncSpotsToSheet(): Promise<boolean> {
  try {
    console.log('Starting spot sync to Google Sheets');
    
    // Fetch all spots from Firestore
    const spotsSnapshot = await db.collection('spots').get();
    const spots = spotsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // For each spot, expand comic information
    const spotsWithComicInfo = await Promise.all(
      spots.map(async (spot: any) => {
        // Get comic information
        if (spot.comicId) {
          const comicDoc = await db.collection('users').doc(spot.comicId).get();
          if (comicDoc.exists) {
            const comicData = comicDoc.data();
            spot.comicName = comicData?.name || 'Unknown';
            spot.comicPhone = comicData?.phoneNumber || 'Unknown';
          }
        }
        
        // Format requestedAt timestamp for readability
        if (spot.requestedAt) {
          spot.requestedDate = new Date((spot.requestedAt as any).seconds * 1000).toLocaleDateString();
          spot.requestedTime = new Date((spot.requestedAt as any).seconds * 1000).toLocaleTimeString();
        }
        
        // Format allocatedSpot data
        if (spot.allocatedSpot) {
          spot.allocatedDay = spot.allocatedSpot.day;
          spot.allocatedTime = spot.allocatedSpot.time;
          if (spot.allocatedSpot.date) {
            spot.allocatedDate = new Date((spot.allocatedSpot.date as any).seconds * 1000).toLocaleDateString();
          }
        }
        
        return spot;
      })
    );
    
    // Sync to Google Sheets
    return await sheetsService.syncDataToSheet(spotsWithComicInfo, 'Spots');
  } catch (error) {
    console.error('Error syncing spots to sheet:', error);
    throw error;
  }
}

/**
 * Sync users from Firestore to Google Sheets
 */
export async function syncUsersToSheet(): Promise<boolean> {
  try {
    console.log('Starting user sync to Google Sheets');
    
    // Fetch all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sync to Google Sheets
    return await sheetsService.syncDataToSheet(users, 'Users');
  } catch (error) {
    console.error('Error syncing users to sheet:', error);
    throw error;
  }
}

/**
 * Update Firestore based on changes in Google Sheet
 * This would be used if admins make direct changes in the Sheet
 */
export async function syncSheetToFirestore(): Promise<boolean> {
  try {
    console.log('Starting sheet to Firestore sync');
    
    // Read spots data from Google Sheets
    const spotValues = await sheetsService.readValues('Spots!A:Z');
    
    if (!spotValues || spotValues.length < 2) {
      console.log('No spot data found in sheet');
      return false;
    }
    
    // Extract header row
    const headers = spotValues[0];
    
    // Process each data row
    const batch = db.batch();
    let changeCount = 0;
    
    for (let i = 1; i < spotValues.length; i++) {
      const row = spotValues[i];
      if (!row[0]) continue; // Skip empty rows
      
      // Create object from row data
      const spotData: { [key: string]: any } = {};
      headers.forEach((header, index) => {
        if (row[index] !== undefined) {
          spotData[header] = row[index];
        }
      });
      
      // Only update if id exists
      if (spotData.id) {
        const spotRef = db.collection('spots').doc(spotData.id);
        
        // We need to format data properly before updating Firestore
        // For example, convert string dates back to Firestore timestamps
        const formattedData: { [key: string]: any } = {};
        
        // Only update specific fields that are editable in the sheet
        if (spotData.status) formattedData.status = spotData.status;
        if (spotData.notes) formattedData.notes = spotData.notes;
        
        // Only update if there are changes
        if (Object.keys(formattedData).length > 0) {
          batch.update(spotRef, formattedData);
          changeCount++;
        }
      }
    }
    
    // Commit all changes
    if (changeCount > 0) {
      await batch.commit();
      console.log(`Updated ${changeCount} spots in Firestore`);
    } else {
      console.log('No changes to commit to Firestore');
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing sheet to Firestore:', error);
    throw error;
  }
} 