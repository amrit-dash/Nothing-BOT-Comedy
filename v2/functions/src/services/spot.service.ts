import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { SpotRequest, SpotValidationResult, SpotDay, SpotTime } from '../models/spot.model';

export class SpotService {
  constructor() {}

  /**
   * Create a new spot request
   */
  async createSpotRequest(userId: string, phoneNumber: string, name: string, isAdmin: boolean = false): Promise<SpotValidationResult> {
    try {
      console.log('Creating spot request:', { userId, phoneNumber, name, isAdmin });

      // Skip validation for admin users
      if (!isAdmin) {
        // Validate the request
        const validation = await this.validateSpotRequest(userId);
        if (!validation.isValid) {  
          console.log('Spot request validation failed:', validation);
          return validation;
        }
      } else {
        console.log('Skipping validation for admin user');
      }

      // Create the spot request
      const spotRequest: SpotRequest = {
        userId,
        phoneNumber,
        name,
        requestedAt: Timestamp.now(),
        status: 'pending',
        updatedAt: Timestamp.now()
      };

      // Get last spot date
      const lastSpot = await this.getLastSpotDate(userId);
      if (lastSpot) {
        spotRequest.lastSpotDate = lastSpot;
      }

      // Save to Firestore
      await db.collection('spots').add(spotRequest);

      console.log('Spot request created successfully');
      return {
        isValid: true,
        status: 200,
        message: isAdmin ? 'Admin spot request created successfully' : 'Spot request created successfully',
        code: 'VALID'
      };
    } catch (error) {
      console.error('Error creating spot request:', error);
      throw error;
    }
  }

  /**
   * Validate a spot request
   */
  private async validateSpotRequest(userId: string): Promise<SpotValidationResult> {
    try {
      // Get user document first to check role
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      // Check for duplicate spots
      const existingSpot = await db.collection('spots')
        .where('userId', '==', userId)
        .where('status', 'in', ['pending', 'approved'])
        .get();

      if (!existingSpot.empty) {
        return {
          isValid: false,
          status: 400,
          message: 'You already have an active spot request',
          code: 'DUPLICATE_SPOT'
        };
      }

      // Check if user had a spot last week
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekSpot = await db.collection('spotHistory')
        .where('userId', '==', userId)
        .where('spotDate', '>=', Timestamp.fromDate(lastWeekStart))
        .get();

      if (!lastWeekSpot.empty) {
        return {
          isValid: false,
          status: 400,
          message: 'You had a spot last week',
          code: 'HAD_SPOT_LAST_WEEK'
        };
      }

      // Check if user is POC
      if (userData?.role === 'poc') {
        return {
          isValid: false,
          status: 400,
          message: 'POCs cannot request spots',
          code: 'IS_POC'
        };
      }

      // Check if user is banned
      if (userData?.isBanned) {
        return {
          isValid: false,
          status: 400,
          message: 'You are currently banned from requesting spots',
          code: 'BANNED'
        };
      }

      // Check if it's a valid request day
      const today = new Date().getDay();
      if (today !== 0 && !userDoc.exists) { // Sunday is 0
        return {
          isValid: false,
          status: 400,
          message: 'Spots can only be requested on Sundays',
          code: 'INVALID_DAY'
        };
      }

      return {
        isValid: true,
        status: 200,
        message: 'Request is valid',
        code: 'VALID'
      };
    } catch (error) {
      console.error('Error validating spot request:', error);
      throw error;
    }
  }

  /**
   * Update spot preferences
   */
  async updateSpotPreferences(
    userId: string,
    preferredDay: SpotDay,
    preferredTime: SpotTime
  ): Promise<void> {
    try {
      console.log('Updating spot preferences:', { userId, preferredDay, preferredTime });

      const spotQuery = await db.collection('spots')
        .where('userId', '==', userId)
        .where('status', '==', 'pending')
        .get();

      if (spotQuery.empty) {
        throw new Error('No pending spot request found');
      }

      const spotDoc = spotQuery.docs[0];
      await spotDoc.ref.update({
        preferredDay,
        preferredTime,
        updatedAt: Timestamp.now()
      });

      console.log('Spot preferences updated successfully');
    } catch (error) {
      console.error('Error updating spot preferences:', error);
      throw error;
    }
  }

  /**
   * Cancel a spot request
   */
  async cancelSpotRequest(userId: string, reason?: string): Promise<void> {
    try {
      console.log('Cancelling spot request:', { userId, reason });

      const spotQuery = await db.collection('spots')
        .where('userId', '==', userId)
        .where('status', 'in', ['pending', 'approved'])
        .get();

      if (spotQuery.empty) {
        throw new Error('No active spot request found');
      }

      const spotDoc = spotQuery.docs[0];
      const spotData = spotDoc.data() as SpotRequest;

      // Update cancellation history
      const cancellationHistory = spotData.cancellationHistory || [];
      cancellationHistory.push({
        date: Timestamp.now(),
        reason
      });

      await spotDoc.ref.update({
        status: 'cancelled',
        cancellationHistory,
        updatedAt: Timestamp.now()
      });

      console.log('Spot request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling spot request:', error);
      throw error;
    }
  }

  /**
   * Get user's last spot date
   */
  private async getLastSpotDate(userId: string): Promise<Timestamp | null> {
    try {
      const lastSpotQuery = await db.collection('spotHistory')
        .where('userId', '==', userId)
        .orderBy('spotDate', 'desc')
        .limit(1)
        .get();

      if (lastSpotQuery.empty) {
        return null;
      }

      return lastSpotQuery.docs[0].data().spotDate;
    } catch (error) {
      console.error('Error getting last spot date:', error);
      throw error;
    }
  }
} 