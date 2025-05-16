import { WhatsAppTextMessage } from '../models/webhook.model';
import { WhatsAppService } from '../services/whatsapp.service';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { SpotRequest, SpotDay, SpotTime } from '../models/spot.model';

// Use production WhatsApp service
const whatsappService = new WhatsAppService();

/**
 * Handle admin commands
 */
export async function handleAdminCommand(message: WhatsAppTextMessage, adminId: string): Promise<void> {
  const text = message.text.body.trim().toLowerCase();
  const args = text.split(' ');
  const command = args[1]; // First word after /admin

  try {
    console.log('Processing admin command:', { text, adminId });

    // Validate admin status first
    const adminDoc = await db.collection('users')
      .where('whatsappId', '==', adminId)
      .where('role', '==', 'admin')
      .limit(1)
      .get();

    if (adminDoc.empty) {
      console.log('Non-admin tried to use admin command:', { adminId });
      await whatsappService.sendTextMessage(
        adminId,
        "You don't have permission to use admin commands."
      );
      return;
    }

    switch (command) {
      case 'help':
        await sendAdminHelp(adminId);
        break;

      case 'list':
        if (args[2] === 'spots') {
          await listSpots(adminId, args[3]); // Optional status filter
        } else if (args[2] === 'users') {
          await listUsers(adminId, args[3]); // Optional role filter
        } else {
          await whatsappService.sendTextMessage(
            adminId,
            "Usage: /admin list <spots|users> [filter]"
          );
        }
        break;

      case 'approve':
        if (args.length < 4) {
          await whatsappService.sendTextMessage(
            adminId,
            "Usage: /admin approve <phone_number> <day> <time>"
          );
          return;
        }
        await approveSpot(adminId, args[2], args[3] as SpotDay, args[4] as SpotTime);
        break;

      case 'reject':
        if (args.length < 3) {
          await whatsappService.sendTextMessage(
            adminId,
            "Usage: /admin reject <phone_number> [reason]"
          );
          return;
        }
        const reason = args.slice(3).join(' ');
        await rejectSpot(adminId, args[2], reason);
        break;

      case 'ban':
        if (args.length < 3) {
          await whatsappService.sendTextMessage(
            adminId,
            "Usage: /admin ban <phone_number> [reason]"
          );
          return;
        }
        const banReason = args.slice(3).join(' ');
        await banUser(adminId, args[2], banReason);
        break;

      case 'unban':
        if (args.length < 3) {
          await whatsappService.sendTextMessage(
            adminId,
            "Usage: /admin unban <phone_number>"
          );
          return;
        }
        await unbanUser(adminId, args[2]);
        break;

      case 'stats':
        await showStats(adminId);
        break;

      default:
        await sendAdminHelp(adminId);
        break;
    }
  } catch (error) {
    console.error('Error handling admin command:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await whatsappService.sendTextMessage(
      adminId,
      `Error: ${errorMessage}. If this persists, please contact the developer.`
    );
  }
}

async function sendAdminHelp(adminId: string): Promise<void> {
  try {
    await whatsappService.sendTextMessage(
      adminId,
      "Admin Commands:\n\n" +
      "- /admin list spots [status]\n" +
      "- /admin list users [role]\n" +
      "- /admin approve <phone> <day> <time>\n" +
      "- /admin reject <phone> [reason]\n" +
      "- /admin ban <phone> [reason]\n" +
      "- /admin unban <phone>\n" +
      "- /admin stats\n" +
      "- /admin help\n\n" +
      "Examples:\n" +
      "/admin list spots pending\n" +
      "/admin approve 919876543210 Monday 8PM\n" +
      "/admin reject 919876543210 Spot not available\n" +
      "/admin ban 919876543210 Multiple no-shows"
    );
  } catch (error) {
    console.error('Error sending admin help:', error);
  }
}

async function listSpots(adminId: string, status?: string): Promise<void> {
  try {
    console.log('Listing spots:', { adminId, status });
    let query = db.collection('spots')
      .orderBy('requestedAt', 'desc')
      .limit(10);

    if (status) {
      query = query.where('status', '==', status);
    }

    const spots = await query.get();
    if (spots.empty) {
      await whatsappService.sendTextMessage(
        adminId,
        `No ${status || ''} spots found.`
      );
      return;
    }

    let message = `${status || 'All'} Spots (Last 10):\n\n`;
    spots.docs.forEach(doc => {
      const spot = doc.data() as SpotRequest;
      message += `${spot.name}\n` +
        `📱 ${spot.phoneNumber}\n` +
        `📅 ${spot.preferredDay || 'Any'} ${spot.preferredTime || 'Any'}\n` +
        `Status: ${spot.status}\n\n`;
    });

    await whatsappService.sendTextMessage(adminId, message);
  } catch (error) {
    console.error('Error listing spots:', error);
    await whatsappService.sendTextMessage(
      adminId,
      "Error listing spots. Please try again."
    );
  }
}

async function listUsers(adminId: string, role?: string): Promise<void> {
  try {
    console.log('Listing users:', { adminId, role });
    let query = db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(10);

    if (role) {
      query = query.where('role', '==', role);
    }

    const users = await query.get();
    if (users.empty) {
      await whatsappService.sendTextMessage(
        adminId,
        `No ${role || ''} users found.`
      );
      return;
    }

    let message = `${role || 'All'} Users (Last 10):\n\n`;
    users.docs.forEach(doc => {
      const user = doc.data();
      message += `${user.name}\n` +
        `📱 ${user.phoneNumber}\n` +
        `Role: ${user.role}\n` +
        `${user.isBanned ? '🚫 BANNED' : ''}\n\n`;
    });

    await whatsappService.sendTextMessage(adminId, message);
  } catch (error) {
    console.error('Error listing users:', error);
    await whatsappService.sendTextMessage(
      adminId,
      "Error listing users. Please try again."
    );
  }
}

async function approveSpot(adminId: string, phoneNumber: string, day: SpotDay, time: SpotTime): Promise<void> {
  try {
    console.log('Approving spot:', { adminId, phoneNumber, day, time });
    // Find the spot request
    const spotQuery = await db.collection('spots')
      .where('phoneNumber', '==', phoneNumber)
      .where('status', '==', 'pending')
      .get();

    if (spotQuery.empty) {
      await whatsappService.sendTextMessage(
        adminId,
        `No pending spot request found for ${phoneNumber}`
      );
      return;
    }

    const spotDoc = spotQuery.docs[0];
    const spot = spotDoc.data() as SpotRequest;

    // Update the spot
    await spotDoc.ref.update({
      status: 'approved',
      allocatedSpot: {
        day,
        time,
        date: Timestamp.now()
      },
      updatedAt: Timestamp.now(),
      updatedBy: adminId
    });

    // Notify the user
    await whatsappService.sendTextMessage(
      spot.userId,
      `Your spot request has been approved!\n\n` +
      `Day: ${day}\n` +
      `Time: ${time}\n\n` +
      `See you at the show! 🎭`
    );

    // Confirm to admin
    await whatsappService.sendTextMessage(
      adminId,
      `Spot approved for ${spot.name}\n` +
      `Day: ${day}\n` +
      `Time: ${time}`
    );
  } catch (error) {
    console.error('Error approving spot:', error);
    await whatsappService.sendTextMessage(
      adminId,
      "Error approving spot. Please try again."
    );
  }
}

async function rejectSpot(adminId: string, phoneNumber: string, reason?: string): Promise<void> {
  try {
    console.log('Rejecting spot:', { adminId, phoneNumber, reason });
    // Find the spot request
    const spotQuery = await db.collection('spots')
      .where('phoneNumber', '==', phoneNumber)
      .where('status', '==', 'pending')
      .get();

    if (spotQuery.empty) {
      await whatsappService.sendTextMessage(
        adminId,
        `No pending spot request found for ${phoneNumber}`
      );
      return;
    }

    const spotDoc = spotQuery.docs[0];
    const spot = spotDoc.data() as SpotRequest;

    // Update the spot
    await spotDoc.ref.update({
      status: 'rejected',
      notes: reason,
      updatedAt: Timestamp.now(),
      updatedBy: adminId
    });

    // Notify the user
    await whatsappService.sendTextMessage(
      spot.userId,
      `Your spot request has been rejected.\n` +
      (reason ? `\nReason: ${reason}` : '') +
      `\n\nPlease try again next week.`
    );

    // Confirm to admin
    await whatsappService.sendTextMessage(
      adminId,
      `Spot rejected for ${spot.name}` +
      (reason ? `\nReason: ${reason}` : '')
    );
  } catch (error) {
    console.error('Error rejecting spot:', error);
    await whatsappService.sendTextMessage(
      adminId,
      "Error rejecting spot. Please try again."
    );
  }
}

async function banUser(adminId: string, phoneNumber: string, reason?: string): Promise<void> {
  try {
    console.log('Banning user:', { adminId, phoneNumber, reason });
    // Find the user
    const userQuery = await db.collection('users')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (userQuery.empty) {
      await whatsappService.sendTextMessage(
        adminId,
        `User not found: ${phoneNumber}`
      );
      return;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Update user
    await userDoc.ref.update({
      isBanned: true,
      banReason: reason,
      banDate: Timestamp.now(),
      bannedBy: adminId
    });

    // Cancel any active spots
    const activeSpots = await db.collection('spots')
      .where('phoneNumber', '==', phoneNumber)
      .where('status', 'in', ['pending', 'approved'])
      .get();

    for (const spotDoc of activeSpots.docs) {
      await spotDoc.ref.update({
        status: 'cancelled',
        notes: 'User banned',
        updatedAt: Timestamp.now(),
        updatedBy: adminId
      });
    }

    // Notify the user
    await whatsappService.sendTextMessage(
      userData.whatsappId,
      `You have been banned from requesting spots.\n` +
      (reason ? `\nReason: ${reason}` : '') +
      `\n\nPlease contact the admins for more information.`
    );

    // Confirm to admin
    await whatsappService.sendTextMessage(
      adminId,
      `User banned: ${userData.name}\n` +
      (reason ? `Reason: ${reason}\n` : '') +
      `${activeSpots.size} active spots cancelled`
    );
  } catch (error) {
    console.error('Error banning user:', error);
    await whatsappService.sendTextMessage(
      adminId,
      "Error banning user. Please try again."
    );
  }
}

async function unbanUser(adminId: string, phoneNumber: string): Promise<void> {
  try {
    console.log('Unbanning user:', { adminId, phoneNumber });
    // Find the user
    const userQuery = await db.collection('users')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (userQuery.empty) {
      await whatsappService.sendTextMessage(
        adminId,
        `User not found: ${phoneNumber}`
      );
      return;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    if (!userData.isBanned) {
      await whatsappService.sendTextMessage(
        adminId,
        `User is not banned: ${userData.name}`
      );
      return;
    }

    // Update user
    await userDoc.ref.update({
      isBanned: false,
      banReason: null,
      banDate: null,
      bannedBy: null,
      unbannedAt: Timestamp.now(),
      unbannedBy: adminId
    });

    // Notify the user
    await whatsappService.sendTextMessage(
      userData.whatsappId,
      `Your ban has been lifted! You can now request spots again.`
    );

    // Confirm to admin
    await whatsappService.sendTextMessage(
      adminId,
      `Ban lifted for ${userData.name}`
    );
  } catch (error) {
    console.error('Error unbanning user:', error);
    await whatsappService.sendTextMessage(
      adminId,
      "Error unbanning user. Please try again."
    );
  }
}

async function showStats(adminId: string): Promise<void> {
  try {
    console.log('Showing stats:', { adminId });
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    // Get this week's stats
    const weekSpots = await db.collection('spots')
      .where('requestedAt', '>=', Timestamp.fromDate(weekStart))
      .get();

    let weekStats = {
      total: weekSpots.size,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    };

    weekSpots.docs.forEach(doc => {
      const spot = doc.data() as SpotRequest;
      if (spot.status in weekStats) {
        weekStats[spot.status as keyof typeof weekStats]++;
      }
    });

    // Get total users
    const users = await db.collection('users').get();
    const banned = await db.collection('users')
      .where('isBanned', '==', true)
      .get();

    const message = 
      "📊 Stats\n\n" +
      "This Week:\n" +
      `Total Requests: ${weekStats.total}\n` +
      `Pending: ${weekStats.pending}\n` +
      `Approved: ${weekStats.approved}\n` +
      `Rejected: ${weekStats.rejected}\n` +
      `Cancelled: ${weekStats.cancelled}\n\n` +
      "Users:\n" +
      `Total Users: ${users.size}\n` +
      `Banned Users: ${banned.size}`;

    await whatsappService.sendTextMessage(adminId, message);
  } catch (error) {
    console.error('Error showing stats:', error);
    await whatsappService.sendTextMessage(
      adminId,
      "Error fetching stats. Please try again."
    );
  }
} 