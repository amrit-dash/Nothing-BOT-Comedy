import { WhatsAppMessage, WhatsAppTextMessage } from '../models/webhook.model';
import { WhatsAppService } from '../services/whatsapp.service';
import { SpotService } from '../services/spot.service';
import { db } from '../config/firebase';
import { handleContactRegistration } from '../handlers/contact.handler';
import { handleAdminCommand } from '../handlers/admin.handler';
import { SpotDay, SpotTime } from '../models/spot.model';

const whatsappService = new WhatsAppService();
const spotService = new SpotService();

/**
 * Process incoming messages
 * @param message WhatsApp message
 * @param senderInfo Sender information
 */
export async function processMessage(message: WhatsAppMessage, senderInfo?: any): Promise<void> {
  try {
    console.log('Processing message:', { type: message.type, from: message.from, senderInfo });

    // Check if user exists
    let userExists = false;
    let isAdmin = false;
    const usersSnapshot = await db.collection('users')
      .where('whatsappId', '==', message.from)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      userExists = true;
      const userData = usersSnapshot.docs[0].data();
      isAdmin = userData.role === 'admin';
      console.log('User found:', { userId: usersSnapshot.docs[0].id, role: userData.role });
    }
    
    // If new user, register them
    if (!userExists && senderInfo) {
      console.log('Registering new user:', { phone: message.from, name: senderInfo.profile.name });
      const textMessage = message as WhatsAppTextMessage;
      await handleContactRegistration(textMessage, {
        phoneNumber: message.from,
        name: senderInfo.profile.name || message.from,
        whatsappId: message.from
      });
    }
    
    // Process message based on type
    if (message.type === 'text') {
      const textMessage = message as WhatsAppTextMessage;
      const text = textMessage.text.body.trim().toLowerCase();
      console.log('Processing text message:', { text });
      
      // Handle admin commands
      if (isAdmin && text.startsWith('/admin')) {
        console.log('Processing admin command');
        await handleAdminCommand(textMessage, message.from);
        return;
      }

      // Handle regular commands
      if (text === 'spot' || text.startsWith('request spot')) {
        console.log('Processing spot request');
        try {
          const result = await spotService.createSpotRequest(
            message.from,
            message.from,
            senderInfo?.profile?.name || message.from,
            isAdmin
          );

          if (result.isValid) {
            await whatsappService.sendTextMessage(
              message.from,
              "Your spot request has been received! Please specify your preferences:\n\n" +
              "Day: Monday/Tuesday/Wednesday/Thursday/Friday/Any\n" +
              "Time: 8PM/10PM/Any\n\n" +
              "Example: 'Monday 8PM' or 'Any Any'" +
              (isAdmin ? "\n\nNote: Admin spot request - all validations bypassed." : "")
            );
          } else {
            let responseMessage = result.message;
            
            // Add custom messages based on error code
            switch (result.code) {
              case 'DUPLICATE_SPOT':
                responseMessage += "\n\nUse 'cancel' to cancel your current request.";
                break;
              case 'HAD_SPOT_LAST_WEEK':
                responseMessage += "\n\nPlease try again next week.";
                break;
              case 'INVALID_DAY':
                responseMessage += "\n\nSpot requests are only accepted on Sundays.";
                break;
            }
            
            await whatsappService.sendTextMessage(message.from, responseMessage);
          }
        } catch (error) {
          console.error('Error processing spot request:', error);
          await whatsappService.sendTextMessage(
            message.from,
            "Sorry, there was an error processing your spot request. Please try again later."
          );
        }
      } else if (text === 'cancel') {
        console.log('Processing spot cancellation');
        try {
          await spotService.cancelSpotRequest(message.from);
          await whatsappService.sendTextMessage(
            message.from,
            "Your spot request has been cancelled."
          );
        } catch (error) {
          console.error('Error cancelling spot:', error);
          await whatsappService.sendTextMessage(
            message.from,
            "You don't have any active spot requests to cancel."
          );
        }
      } else {
        // Check if this is a spot preference update
        const words = text.split(' ');
        if (words.length === 2) {
          const [day, time] = words;
          const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'any'];
          const validTimes = ['8pm', '10pm', 'any'];

          if (validDays.includes(day) && validTimes.includes(time.toLowerCase())) {
            console.log('Processing spot preference update');
            try {
              await spotService.updateSpotPreferences(
                message.from,
                (day === 'any' ? 'Any' : day.charAt(0).toUpperCase() + day.slice(1)) as SpotDay,
                (time.toLowerCase() === 'any' ? 'Any' : time.toUpperCase()) as SpotTime
              );
              
              await whatsappService.sendTextMessage(
                message.from,
                "Your spot preferences have been updated. We'll notify you once your spot is confirmed."
              );
            } catch (error) {
              console.error('Error updating spot preferences:', error);
              await whatsappService.sendTextMessage(
                message.from,
                "You need to request a spot first before setting preferences. Send 'spot' to request a spot."
              );
            }
          } else {
            await sendHelpMessage(message.from, isAdmin);
          }
        } else {
          await sendHelpMessage(message.from, isAdmin);
        }
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
    
    try {
      if (message.from) {
        await whatsappService.sendTextMessage(
          message.from,
          "Sorry, there was an error processing your message. Please try again later."
        );
      }
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
}

async function sendHelpMessage(to: string, isAdmin: boolean): Promise<void> {
  await whatsappService.sendTextMessage(
    to,
    "Available commands:\n\n" +
    "- spot (request a spot)\n" +
    "- cancel (cancel your spot request)\n" +
    "- [day] [time] (set spot preferences, e.g., 'Monday 8PM' or 'Any Any')\n" +
    (isAdmin ? "- /admin help (view admin commands)\n" : "")
  );
} 