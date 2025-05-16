# Spots Manager Bot v2

A WhatsApp bot for managing open mic spots using the WhatsApp Business API, Google Cloud Functions, and Firestore.

## Features

- WhatsApp Business API integration
- Spot request and management
- User registration and role-based access
- Admin commands for spot approval/rejection
- WhatsApp group management
- Google Sheets integration

## Setup Instructions

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- WhatsApp Business API account
- Google Cloud project with billing enabled

### Environment Setup

1. Clone this repository
2. Navigate to the functions directory:
   ```
   cd "Spots Manager v2/functions"
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Copy the example environment file:
   ```
   cp .env.example .env
   ```
5. Fill in your environment variables in the `.env` file:
   - WhatsApp Business API credentials
   - Google Sheet ID
   - Webhook verification token
   - Project settings

### Firebase Setup

1. Login to Firebase:
   ```
   firebase login
   ```
2. Initialize Firebase with your project:
   ```
   firebase use --add
   ```
   Select your project ID: `spots-manager-bot`

### Deployment

1. Deploy Firestore rules and indexes:
   ```
   firebase deploy --only firestore
   ```
2. Deploy Cloud Functions:
   ```
   firebase deploy --only functions
   ```

### WhatsApp Business API Setup

1. Set up your WhatsApp Business account at [Facebook Business Manager](https://business.facebook.com/)
2. Configure your webhook URL to point to your deployed Cloud Function
3. Use the verification token you specified in your `.env` file
4. Subscribe to the necessary webhook events (messages, message_status)

## Development

### Local Testing

1. Start the Firebase emulators:
   ```
   npm run serve
   ```
2. Use a tool like ngrok to expose your local server:
   ```
   ngrok http 5001
   ```
3. Configure your webhook URL to point to your ngrok URL

### Project Structure

- `/functions/src/handlers`: Message and command handlers
- `/functions/src/models`: TypeScript interfaces and types
- `/functions/src/services`: External API integrations
- `/functions/src/utils`: Utility functions
- `/functions/src/config`: Configuration files

## License

This project is licensed under the MIT License - see the LICENSE file for details. 