# Nothing BOT Comedy

<div align="left">
  <h3>The Comedy Open Mic Automation System</h3>
</div>



<div align="center">
    <img src="https://img.shields.io/badge/Type-WhatsApp_Bot-brightgreen" alt="Type: WhatsApp Bot">
    <img src="https://img.shields.io/badge/Duration-7_Months-blue" alt="Duration: 7 Months">
    <img src="https://img.shields.io/badge/Status-Decommissioned-blue" alt="Status: Decommissioned">
    <img src="https://img.shields.io/badge/Processed-2200%2B_Requests-orange" alt="Processed: 2200+ Requests">
    <img src="https://img.shields.io/badge/User_Base-150%2B_Comics-blueviolet" alt="User Base: 150+ Comics">
</div>

<div align="center">
    <img src="https://img.shields.io/badge/-Glen's_Bakehouse,_Koramangala
-white" alt="Glen's Bakehouse, Koramangala">
    <img src="https://img.shields.io/badge/-Punchlime_Productions-black" alt="Punchlime Production">
</div>

## 📱 Overview

The **Nothing BOT Comedy** was a WhatsApp-based automation system designed to streamline the management of open mic spot allocations at Glen's Bakehouse comedy club in Bangalore. It served as a digital curator, handling spot requests, managing preferences, and facilitating seamless communication between comics and venue managers.

Over its 7-month lifespan, the bot processed more than 2200 requests and maintained a database of 150+ comics, distributing 20-25 weekly spots efficiently.

<div align="center">
<br>
<a href="https://wa.me/message/OGQRIVZ7W7JAN1">
    <img src="https://img.shields.io/badge/Check_Out_The_BOT-Make_a_Spot_Request_Now-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp Contact">
</a>
<br>
<br>
</div>

## 🤖 Project Versions

The project evolved through two significant iterations:

### Version 1 (Deployed) 

<div align="center">
    <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp">
    <img src="https://img.shields.io/badge/Google_Apps_Script-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Apps Script">
    <img src="https://img.shields.io/badge/Google_Sheets-34A853?style=for-the-badge&logo=google-sheets&logoColor=white" alt="Google Sheets">
    <img src="https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white" alt="Twilio">
</div>

A fully functional WhatsApp Bot powered by:
- **Twilio**: Handled the conversational front-end via WhatsApp Business API
- **Twilio Studio Flow**: Managed conversation flows and message routing
- **Google Apps Script**: Processed business logic and managed data
- **Google Sheets**: Served as the database and admin panel

This version was in production for 7 months, handling all spot management duties at the venue.

### Version 2 (In Development)

<div align="center">
    <img src="https://img.shields.io/badge/WhatsApp_API-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp API">
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firestore">
</div>

An enhanced version designed to improve scalability and performance:
- **WhatsApp Business API**: Direct integration without Twilio
- **Firebase Functions**: Serverless backend replacing Apps Script
- **Firestore**: NoSQL database for improved data handling
- **TypeScript**: Type-safe code with improved maintainability
- **Cloud Functions**: Event-driven architecture for better performance

Development was discontinued when the venue closed operations.

## 🚀 Features

<div align="center">
  <table>
    <tr>
      <td align="center">🗣️</td>
      <td><b>Conversational Interface</b>: Natural language processing to understand spot requests</td>
    </tr>
    <tr>
      <td align="center">📋</td>
      <td><b>Automated Spot Management</b>: Tracking of availability, allocation, and confirmation</td>
    </tr>
    <tr>
      <td align="center">⏰</td>
      <td><b>Preference Management</b>: Comics could specify day and time preferences</td>
    </tr>
    <tr>
      <td align="center">🖥️</td>
      <td><b>Admin Dashboard</b>: Google Sheets integration for venue managers</td>
    </tr>
    <tr>
      <td align="center">👥</td>
      <td><b>WhatsApp Group Management</b>: Automatic creation and management of show groups</td>
    </tr>
    <tr>
      <td align="center">📊</td>
      <td><b>Stats Tracking</b>: Historical data on allocations and participation</td>
    </tr>
    <tr>
      <td align="center">⚖️</td>
      <td><b>Fair Distribution</b>: Algorithms to ensure equitable spot distribution</td>
    </tr>
  </table>
</div>

## 📊 Impact

- **150+ Comics Requested For Spots** to the bot
- **85+ New Comics registered** using the bot
- **2200+ Messages processed** from comics
- **20-25 Weekly spots** allocated efficiently
- **Reduced administrative overhead** by 90%
- **Eliminated double bookings** and scheduling conflicts
- **Streamlined communication** between comics and production

## 🛠️ Technical Architecture

<div align="center">

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  WhatsApp User  │◄──►│  Twilio Flow    │◄──►│  Apps Script    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                                                       ▼
                                             ┌─────────────────┐
                                             │                 │
                                             │ Google Sheets   │
                                             │                 │
                                             └─────────────────┘
```

</div>

## 💬 Bot Commands

The bot responded to various commands, including:

- **"Spot"**: Request a spot for the next week
- **"My spot"**: Check if you have a spot for the current week
- **"Cancel spot"**: Cancel your allocated spot
- **"Who am I"**: Check your registration details
- **"Help"**: Display available commands

## 🧠 Lessons Learned

- **Conversation Design**: Building effective multi-step conversational flows
- **State Management**: Tracking user context across multiple interactions
- **Integration Architecture**: Connecting multiple services seamlessly
- **Admin Experience**: Creating intuitive interfaces for non-technical users
- **Scalability Challenges**: Managing growing user base with limited resources

## 🙏 Acknowledgements

Special thanks to our boiz at Punchlime Productions and all the comics who used and provided feedback on the bot during its operation. 

## 📨 Contact

For more information about this project or to connect with the developer:

- **Developer**: [@_amrit_dash\_](https://www.instagram.com/_amrit_dash_/)
- **Production House**: [@punchlimeproduction](https://www.instagram.com/punchlimeproductions/)
- **Show Venue**: Glen's Bakehouse, Koramangala, Bangalore

<div align="center">
<br>
  <a href="https://www.instagram.com/_amrit_dash_/">
    <img src="https://img.shields.io/badge/@__amrit__dash__-Follow-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram Follow">
  </a>
  <a href="https://www.instagram.com/punchlimeproductions/">
    <img src="https://img.shields.io/badge/@PunchlimeProductions-Follow-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram Follow">
  </a>
</div>

<div align="center">
    <br>
    <br>
    ---
    <p>Made with ❤️ for the Bangalore comedy scene</p>
</div> 