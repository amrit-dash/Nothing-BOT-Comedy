import { Timestamp } from 'firebase-admin/firestore';
import { SpotTime } from './spot.model';

export interface WhatsAppSettings {
  messageQuota: number;  // Monthly message limit (1000)
  quotaResetDate: Timestamp;
  messagesSent: number;
}

export interface SpotTimeConfig {
  maxSpots: number;
  defaultDuration: number; // Minutes per spot
}

export interface SpotSettings {
  maxSpotsPerComic: number;
  blackoutDates: Timestamp[];
  autoApprovalEnabled: boolean;
  spotTimes: Record<SpotTime, SpotTimeConfig>;
  banList: string[];
  cooldownPeriod: number; // Days between allowed spot requests
}

export interface Config {
  whatsappSettings: WhatsAppSettings;
  spotSettings: SpotSettings;
} 