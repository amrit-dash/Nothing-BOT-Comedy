import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { WhatsAppService } from '../test/mocks/whatsapp.service.mock';

// Initialize Firebase for local testing only if not already initialized
const TEST_APP_NAME = 'spots-manager-bot-test';
const app = getApps().find(a => a.name === TEST_APP_NAME) || 
  initializeApp({
    projectId: TEST_APP_NAME
  }, TEST_APP_NAME);

// Connect to the local Firestore emulator
const db: Firestore = getFirestore(app);
db.settings({
  host: 'localhost:8080',
  ssl: false
});

// Export mock WhatsApp service
const whatsappService = new WhatsAppService();

export { db, whatsappService }; 