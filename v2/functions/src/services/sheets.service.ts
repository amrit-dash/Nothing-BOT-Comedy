import { google, sheets_v4 } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Google Sheets API setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

/**
 * Service for interacting with Google Sheets
 */
export class SheetsService {
  private sheets: sheets_v4.Sheets;

  /**
   * Initialize Google Sheets API client
   * Uses Application Default Credentials - this works with service accounts in GCP
   */
  constructor() {
    const auth = new google.auth.GoogleAuth({
      scopes: SCOPES,
    });

    this.sheets = google.sheets({
      version: 'v4',
      auth,
    });
  }

  /**
   * Read values from a sheet
   * @param range The A1 notation of the range to read
   * @returns The values from the range
   */
  async readValues(range: string): Promise<any[][]> {
    try {
      if (!SHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID not set in environment variables');
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Error reading from sheet:', error);
      throw error;
    }
  }

  /**
   * Write values to a sheet
   * @param range The A1 notation of the range to write
   * @param values The values to write
   * @returns Success status
   */
  async writeValues(range: string, values: any[][]): Promise<boolean> {
    try {
      if (!SHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID not set in environment variables');
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      return true;
    } catch (error) {
      console.error('Error writing to sheet:', error);
      throw error;
    }
  }

  /**
   * Clear values from a sheet
   * @param range The A1 notation of the range to clear
   * @returns Success status
   */
  async clearValues(range: string): Promise<boolean> {
    try {
      if (!SHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID not set in environment variables');
      }

      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range,
      });

      return true;
    } catch (error) {
      console.error('Error clearing sheet:', error);
      throw error;
    }
  }

  /**
   * Sync data from Firestore to Sheets
   * @param data The data to sync
   * @param sheetName The name of the sheet tab
   * @returns Success status
   */
  async syncDataToSheet(data: any[], sheetName: string): Promise<boolean> {
    try {
      // Convert data to 2D array for sheets
      const headerRow = Object.keys(data[0] || {});
      const rows = data.map(item => headerRow.map(key => {
        const value = item[key];
        
        // Format timestamps and special objects for Sheets
        if (value && typeof value === 'object' && value.seconds) {
          // Convert Firestore timestamp to date string
          return new Date(value.seconds * 1000).toLocaleString();
        } else if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        
        return value;
      }));
      
      // Combine header and data rows
      const values = [headerRow, ...rows];
      
      // Clear existing data and write new data
      const range = `${sheetName}!A1:${this.columnToLetter(headerRow.length)}${rows.length + 1}`;
      await this.clearValues(range);
      return await this.writeValues(range, values);
    } catch (error) {
      console.error('Error syncing data to sheet:', error);
      throw error;
    }
  }

  /**
   * Convert column index to letter (e.g., 1 -> A, 2 -> B, 27 -> AA)
   * @param column Column index (1-based)
   * @returns Column letter
   */
  private columnToLetter(column: number): string {
    let temp, letter = '';
    while (column > 0) {
      temp = (column - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      column = (column - temp - 1) / 26;
    }
    return letter;
  }
} 