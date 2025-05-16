import { Timestamp } from 'firebase-admin/firestore';

export type UserRole = 'admin' | 'poc' | 'comic';

export interface User {
  phoneNumber: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
  whatsappId?: string;
  spotHistory: {
    totalSpots: number;
    lastSpotDate: Timestamp | null;
  };
}

export interface UserCreate extends Omit<User, 'createdAt' | 'lastUpdated' | 'spotHistory'> {
  spotHistory?: {
    totalSpots: number;
    lastSpotDate: Timestamp | null;
  };
} 