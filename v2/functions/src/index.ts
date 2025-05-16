import * as functions from 'firebase-functions/v1';
import { webhookHandler } from './handlers/webhook.handler';
import { initializeConfig } from './utils/initialize-config';
import { syncSpotsToSheet, syncUsersToSheet, syncSheetToFirestore } from './utils/sheet-sync';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define region
const region = process.env.GCP_REGION || 'asia-south1';

// Export webhook handler
export const whatsappWebhook = functions.region(region).https.onRequest(async (req: functions.Request, res: functions.Response) => {
  return await webhookHandler(req, res);
});

// Initialize config when deployed
export const createInitialConfig = functions
  .region(region)
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    try {
      await initializeConfig();
      res.status(200).send('Configuration initialized successfully!');
    } catch (error) {
      console.error('Error initializing config:', error);
      res.status(500).send('Error initializing configuration.');
    }
  });

// Manual trigger for sheet sync (for admins)
export const manualSheetSync = functions
  .region(region)
  .runWith({ memory: '1GB', timeoutSeconds: 300 })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    try {
      // Add a simple API key check
      const apiKey = req.query.key;
      if (!apiKey || apiKey !== process.env.SHEET_SYNC_API_KEY) {
        res.status(403).send('Unauthorized');
        return;
      }
      
      // Sync data to sheets
      await syncSpotsToSheet();
      await syncUsersToSheet();
      
      res.status(200).send('Data synced to Google Sheets successfully!');
    } catch (error) {
      console.error('Error syncing data to sheets:', error);
      res.status(500).send('Error syncing data to sheets.');
    }
  });

// Scheduled sync from Firestore to Sheets (runs daily)
export const scheduledFirestoreToSheetSync = functions
  .region(region)
  .runWith({ memory: '1GB', timeoutSeconds: 300 })
  .pubsub.schedule('0 4 * * *') // Run at 4 AM every day
  .timeZone('Asia/Kolkata') // Indian Standard Time
  .onRun(async (_context: functions.EventContext) => {
    try {
      console.log('Running scheduled Firestore to Sheet sync');
      await syncSpotsToSheet();
      await syncUsersToSheet();
      console.log('Scheduled sync completed successfully');
      return null;
    } catch (error) {
      console.error('Error in scheduled sync:', error);
      return null;
    }
  });

// Scheduled sync from Sheets to Firestore (runs daily)
export const scheduledSheetToFirestoreSync = functions
  .region(region)
  .runWith({ memory: '1GB', timeoutSeconds: 300 })
  .pubsub.schedule('30 4 * * *') // Run at 4:30 AM every day
  .timeZone('Asia/Kolkata') // Indian Standard Time
  .onRun(async (_context: functions.EventContext) => {
    try {
      console.log('Running scheduled Sheet to Firestore sync');
      await syncSheetToFirestore();
      console.log('Scheduled sync completed successfully');
      return null;
    } catch (error) {
      console.error('Error in scheduled sync:', error);
      return null;
    }
  });

// TODO: Add additional functions for:
// 1. Group management
// 2. Scheduled tasks (daily cleanup, reports)
// 3. Google Sheets synchronization 