import { WhatsAppTextMessage } from '../models/webhook.model';
import { WhatsAppService } from '../services/whatsapp.service';
import { db } from '../config/firebase';

const whatsappService = new WhatsAppService();

interface ContactInfo {
  phoneNumber: string;
  name: string;
  whatsappId: string;
}

/**
 * Handle contact registration
 * @param message WhatsApp text message
 * @param contactInfo Contact information
 */
export async function handleContactRegistration(
  message: WhatsAppTextMessage,
  contactInfo: ContactInfo
): Promise<void> {
  try {
    // Create new user document
    await db.collection('users').add({
      phoneNumber: contactInfo.phoneNumber,
      name: contactInfo.name,
      whatsappId: contactInfo.whatsappId,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await whatsappService.sendTextMessage(
      message.from,
      `Welcome ${contactInfo.name}! You've been registered successfully.\n\n` +
      "Available commands:\n" +
      "- spot (request a spot)\n" +
      "- cancel (cancel your spot)"
    );
  } catch (error) {
    console.error('Error registering contact:', error);
    await whatsappService.sendTextMessage(
      message.from,
      "Sorry, there was an error registering your contact. Please try again later."
    );
  }
} 