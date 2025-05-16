// Set test environment
process.env.NODE_ENV = 'test';

import { handleAdminCommand } from '../handlers/admin.handler';
import { WhatsAppTextMessage } from '../models/webhook.model';
import { setupTestData, clearTestData } from './test-utils';

async function testAdminCommands() {
  try {
    // Setup test data
    console.log('Setting up test data...');
    await setupTestData();

    const adminId = '1234567891'; // Test admin's WhatsApp ID
    const testPhone = '919876543210'; // Test user's phone number

    // Test help command
    console.log('\nTesting help command...');
    await handleAdminCommand(createMessage('/admin help', adminId), adminId);

    // Test list spots command
    console.log('\nTesting list spots command...');
    await handleAdminCommand(createMessage('/admin list spots', adminId), adminId);
    await handleAdminCommand(createMessage('/admin list spots pending', adminId), adminId);
    await handleAdminCommand(createMessage('/admin list spots approved', adminId), adminId);

    // Test list users command
    console.log('\nTesting list users command...');
    await handleAdminCommand(createMessage('/admin list users', adminId), adminId);
    await handleAdminCommand(createMessage('/admin list users admin', adminId), adminId);

    // Test approve spot command
    console.log('\nTesting approve spot command...');
    await handleAdminCommand(
      createMessage(`/admin approve ${testPhone} Wednesday 7PM`, adminId),
      adminId
    );

    // Test reject spot command
    console.log('\nTesting reject spot command...');
    await handleAdminCommand(
      createMessage(`/admin reject ${testPhone} Spot not available`, adminId),
      adminId
    );

    // Test ban user command
    console.log('\nTesting ban user command...');
    await handleAdminCommand(
      createMessage(`/admin ban ${testPhone} Multiple no-shows`, adminId),
      adminId
    );

    // Test unban user command
    console.log('\nTesting unban user command...');
    await handleAdminCommand(
      createMessage(`/admin unban ${testPhone}`, adminId),
      adminId
    );

    // Test stats command
    console.log('\nTesting stats command...');
    await handleAdminCommand(createMessage('/admin stats', adminId), adminId);

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up test data
    console.log('\nCleaning up test data...');
    await clearTestData();
  }
}

function createMessage(text: string, from: string): WhatsAppTextMessage {
  return {
    from,
    text: { body: text },
    type: 'text',
    id: `test-${Date.now()}`
  };
}

// Run the tests
console.log('Starting admin command tests...');
testAdminCommands(); 