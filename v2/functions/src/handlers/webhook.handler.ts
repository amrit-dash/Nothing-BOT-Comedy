import * as functions from 'firebase-functions/v1';
import { WhatsAppMessage } from '../models/webhook.model';
import { processMessage } from '../utils/message-router';
import axios from 'axios';

/**
 * Combined webhook handler for both verification and incoming messages
 */
export async function webhookHandler(
  req: functions.Request,
  res: functions.Response
): Promise<void> {
  try {
    // Handle GET request for webhook verification
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      console.log('Webhook verification attempt:', { mode, token, configToken: functions.config().whatsapp.verify_token });

      if (mode === 'subscribe' && token === functions.config().whatsapp.verify_token) {
        console.log('Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        console.log('Webhook verification failed');
        res.sendStatus(403);
      }
      return;
    }

    // Handle POST request for incoming messages
    if (req.method === 'POST') {
      console.log('Received webhook request:', JSON.stringify(req.body));

      const { entry } = req.body;

      if (!entry || !Array.isArray(entry)) {
        console.log('Invalid request body - missing or invalid entry array');
        res.sendStatus(400);
        return;
      }

      for (const e of entry) {
        if (e.changes && Array.isArray(e.changes)) {
          for (const change of e.changes) {
            if (change.value && change.value.messages && Array.isArray(change.value.messages)) {
              for (const message of change.value.messages) {
                const whatsappMessage = message as WhatsAppMessage;
                const senderInfo = change.value.contacts?.[0];
                await processMessage(whatsappMessage, senderInfo);

                // Mark message as read
                if (change.value.metadata?.phone_number_id) {
                  try {
                    await axios({
                      method: 'POST',
                      url: `https://graph.facebook.com/v22.0/${change.value.metadata.phone_number_id}/messages`,
                      headers: {
                        Authorization: `Bearer ${functions.config().whatsapp.graph_api_token}`,
                      },
                      data: {
                        messaging_product: 'whatsapp',
                        status: 'read',
                        message_id: whatsappMessage.id,
                      },
                    });
                  } catch (error) {
                    console.error('Error marking message as read:', error);
                  }
                }
              }
            }
          }
        }
      }

      res.sendStatus(200);
      return;
    }

    // Handle unsupported methods
    res.sendStatus(405);
  } catch (error) {
    console.error('Error in webhook handler:', error);
    res.sendStatus(500);
  }
} 