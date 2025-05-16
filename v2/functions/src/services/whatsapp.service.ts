import axios from 'axios';
import * as functions from 'firebase-functions/v1';

// WhatsApp API config
const apiVersion = 'v22.0';
const phoneNumberId = functions.config().whatsapp.phone_number_id;
const accessToken = functions.config().whatsapp.graph_api_token;
const baseUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;

/**
 * WhatsApp service for interacting with the WhatsApp Business API
 */
export class WhatsAppService {
  /**
   * Send a text message to a WhatsApp user
   * @param to Phone number to send to (with country code, no +)
   * @param text Message text
   * @returns API response
   */
  async sendTextMessage(to: string, text: string) {
    try {
      const response = await axios.post(
        `${baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: {
            preview_url: false,
            body: text,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      // Don't throw the error to prevent retries
      return null;
    }
  }

  /**
   * Send a template message to a WhatsApp user
   * @param to Phone number to send to (with country code, no +)
   * @param templateName Name of the template
   * @param languageCode Language code (e.g., 'en_US')
   * @param components Template components (header, body, buttons)
   * @returns API response
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en_US',
    components: any[] = []
  ) {
    try {
      const response = await axios.post(
        `${baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode,
            },
            components,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      // Don't throw the error to prevent retries
      return null;
    }
  }

  /**
   * Mark a message as read
   * @param messageId Message ID to mark as read
   * @returns API response
   */
  async markMessageAsRead(messageId: string) {
    try {
      const response = await axios.post(
        `${baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      // Don't throw the error to prevent retries
      return null;
    }
  }
} 