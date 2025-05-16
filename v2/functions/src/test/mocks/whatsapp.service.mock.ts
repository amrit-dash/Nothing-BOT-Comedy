export class WhatsAppService {
  async sendTextMessage(to: string, text: string): Promise<void> {
    console.log(`[MOCK] WhatsApp message to ${to}:`);
    console.log(text);
    console.log('-------------------');
  }

  async sendTemplateMessage(to: string, template: string, params: any[]): Promise<void> {
    console.log(`[MOCK] WhatsApp template message to ${to}:`);
    console.log(`Template: ${template}`);
    console.log('Params:', params);
    console.log('-------------------');
  }
} 