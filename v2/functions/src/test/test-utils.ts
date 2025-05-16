import { db } from '../config/test.config';
import { Timestamp } from 'firebase-admin/firestore';

export async function setupTestData() {
  // Clear existing data
  await clearTestData();

  // Create test users
  await db.collection('users').doc('user1').set({
    name: 'Test User',
    phoneNumber: '919876543210',
    whatsappId: '1234567890',
    role: 'user',
    isBanned: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  await db.collection('users').doc('admin1').set({
    name: 'Test Admin',
    phoneNumber: '919876543211',
    whatsappId: '1234567891',
    role: 'admin',
    isBanned: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  // Create test spots
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  await db.collection('spots').doc('spot1').set({
    userId: '1234567890',
    name: 'Test User',
    phoneNumber: '919876543210',
    status: 'pending',
    preferredDay: 'Monday',
    preferredTime: '8PM',
    requestedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  await db.collection('spots').doc('spot2').set({
    userId: '1234567890',
    name: 'Test User',
    phoneNumber: '919876543210',
    status: 'approved',
    preferredDay: 'Tuesday',
    preferredTime: '9PM',
    requestedAt: Timestamp.fromDate(weekStart),
    updatedAt: Timestamp.now(),
    allocatedSpot: {
      day: 'Tuesday',
      time: '9PM',
      date: Timestamp.now()
    }
  });

  console.log('Test data setup completed');
}

export async function clearTestData() {
  const collections = ['users', 'spots'];
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
  console.log('Test data cleared');
} 