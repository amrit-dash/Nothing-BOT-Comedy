export interface WhatsAppBaseMessage {
  from: string;
  type: string;
  id: string;
}

export interface WhatsAppTextMessage extends WhatsAppBaseMessage {
  type: 'text';
  text: {
    body: string;
  };
}

export interface WhatsAppButton extends WhatsAppBaseMessage {
  type: 'button';
  button: {
    payload: string;
    text: string;
  };
}

export interface WhatsAppInteractive extends WhatsAppBaseMessage {
  type: 'interactive';
  interactive: {
    type: string;
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
}

export type WhatsAppMessage = WhatsAppTextMessage | WhatsAppButton | WhatsAppInteractive;

export interface WhatsAppProfile {
  name: string;
}

export interface WhatsAppContact {
  profile: WhatsAppProfile;
  wa_id: string;
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: {
    value: {
      messaging_product: 'whatsapp';
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: {
        profile: {
          name: string;
        };
        wa_id: string;
      }[];
      messages?: WhatsAppMessage[];
      statuses?: {
        id: string;
        recipient_id: string;
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        errors?: {
          code: number;
          title: string;
        }[];
      }[];
    };
    field: 'messages';
  }[];
}

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppWebhookEntry[];
} 