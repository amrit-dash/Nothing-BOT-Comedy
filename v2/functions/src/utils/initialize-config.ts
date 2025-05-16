import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { Config, SpotSettings, WhatsAppSettings } from '../models/config.model';

/**
 * Initialize default configuration in Firestore
 */
export async function initializeConfig() {
  console.log('Initializing default configuration in Firestore...');
  
  // Check if config already exists
  const configRef = db.collection('config').doc('appConfig');
  const configDoc = await configRef.get();
  
  if (configDoc.exists) {
    console.log('Configuration already exists, skipping initialization.');
    return;
  }
  
  // Create default WhatsApp settings
  const whatsappSettings: WhatsAppSettings = {
    messageQuota: 1000, // Monthly limit
    quotaResetDate: Timestamp.fromDate(new Date(new Date().setDate(1))), // First day of current month
    messagesSent: 0
  };
  
  // Create default spot settings
  const spotSettings: SpotSettings = {
    maxSpotsPerComic: 2,
    blackoutDates: [],
    autoApprovalEnabled: false,
    spotTimes: {
      '8PM': {
        maxSpots: 10,
        defaultDuration: 5
      },
      '10PM': {
        maxSpots: 8,
        defaultDuration: 6
      }
    },
    banList: [],
    cooldownPeriod: 7
  };
  
  // Create full config
  const config: Config = {
    whatsappSettings,
    spotSettings
  };
  
  // Save to Firestore
  await configRef.set(config);
  
  // Create initial user settings document (for admin/POC numbers)
  await db.collection('config').doc('userSettings').set({
    adminNumbers: [],
    pocNumbers: []
  });
  
  // Create initial groups document
  const groupsRef = db.collection('groups');
  
  // Create default groups
  const defaultGroups = [
    {
      groupId: '', // To be filled with real group ID
      name: '8PM Lineup',
      type: '8PM',
      currentMembers: [],
      lastUpdated: Timestamp.now()
    },
    {
      groupId: '', // To be filled with real group ID
      name: '10PM Lineup',
      type: '10PM',
      currentMembers: [],
      lastUpdated: Timestamp.now()
    },
    {
      groupId: '', // To be filled with real group ID
      name: 'POC Group',
      type: 'POC',
      currentMembers: [],
      lastUpdated: Timestamp.now()
    },
    {
      groupId: '', // To be filled with real group ID
      name: 'Admin Group',
      type: 'ADMIN',
      currentMembers: [],
      lastUpdated: Timestamp.now()
    }
  ];
  
  // Add all groups
  const batch = db.batch();
  for (const group of defaultGroups) {
    const docRef = groupsRef.doc();
    batch.set(docRef, group);
  }
  
  await batch.commit();
  
  console.log('Default configuration initialized successfully.');
} 