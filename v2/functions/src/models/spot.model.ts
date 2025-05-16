import { Timestamp } from 'firebase-admin/firestore';

export type SpotStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'no_spot';
export type SpotTime = '8PM' | '10PM';
export type SpotDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Any';

export interface SpotRequest {
  userId: string;  // Reference to Users collection (WhatsApp ID)
  phoneNumber: string;
  name: string;
  requestedAt: Timestamp;
  status: SpotStatus;
  preferredDay?: SpotDay;
  preferredTime?: SpotTime;
  allocatedSpot?: {
    day: SpotDay;
    time: SpotTime;
    date: Timestamp;
  };
  lastSpotDate?: Timestamp;
  cancellationHistory?: {
    date: Timestamp;
    reason?: string;
  }[];
  notes?: string;
  updatedAt: Timestamp;
  updatedBy?: string;
}

export interface SpotHistory {
  userId: string;
  phoneNumber: string;
  name: string;
  spotDate: Timestamp;
  time: SpotTime;
  status: SpotStatus;
  attended: boolean;
  notes?: string;
}

export interface SpotValidationResult {
  isValid: boolean;
  status: number;
  message: string;
  code: 
    | 'DUPLICATE_SPOT'          // Already has a spot request
    | 'SPOT_ALLOCATED'          // Already has a spot this week
    | 'INVALID_DAY'            // Not a valid request day
    | 'IS_POC'                 // Is a POC
    | 'BANNED'                 // User is banned
    | 'IGNORED'                // User is in ignore list
    | 'HAD_SPOT_LAST_WEEK'     // Had a spot last week
    | 'VALID';                 // Request is valid
}

export interface SpotRequestCreate extends Omit<SpotRequest, 'requestedAt'> {
  requestedAt?: Timestamp;
} 