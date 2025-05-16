import { Timestamp } from 'firebase-admin/firestore';

export type GroupType = '8PM' | '10PM' | 'POC' | 'ADMIN';

export interface WhatsAppGroup {
  groupId: string;
  name: string;
  type: GroupType;
  currentMembers: string[];  // Array of phone numbers
  lastUpdated: Timestamp;
}

export interface GroupOperation {
  operation: 'add' | 'remove' | 'message' | 'poll';
  groupId: string;
  phoneNumbers?: string[];
  message?: string;
  pollOptions?: string[];
} 