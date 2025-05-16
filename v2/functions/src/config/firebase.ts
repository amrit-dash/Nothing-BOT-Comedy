import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.PROJECT_ID || 'spots-manager-bot',
  });
}

// Firestore DB
const db = admin.firestore();

// Export Firebase Admin and Firestore
export { admin, db, functions }; 