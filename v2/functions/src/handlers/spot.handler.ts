import { WhatsAppTextMessage } from '../models/webhook.model';
import { WhatsAppService } from '../services/whatsapp.service';
import { db } from '../config/firebase';

const whatsappService = new WhatsAppService();

/**
 * Handle spot request from a user
 * @param message WhatsApp text message
 * @param userId User's WhatsApp ID
 */
export async function handleSpotRequest(message: WhatsAppTextMessage, userId: string): Promise<void> {
  try {
    // Check if user already has a pending spot
    const spotsRef = db.collection('spots');
    const existingSpots = await spotsRef
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    if (!existingSpots.empty) {
      await whatsappService.sendTextMessage(
        message.from,
        "You already have a pending spot request. Please wait for approval or cancel your existing request."
      );
      return;
    }

    // Create new spot request
    await spotsRef.add({
      userId,
      status: 'pending',
      requestedAt: new Date(),
      messageId: message.text.body,
      phoneNumber: message.from
    });

    await whatsappService.sendTextMessage(
      message.from,
      "Your spot request has been received! We'll notify you once it's approved."
    );
  } catch (error) {
    console.error('Error handling spot request:', error);
    await whatsappService.sendTextMessage(
      message.from,
      "Sorry, there was an error processing your spot request. Please try again later."
    );
  }
} 