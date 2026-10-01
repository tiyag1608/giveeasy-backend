# 💝 GiveEasy - Backend Donation Platform

> **Scalable, Real-Time Fundraising & NGO Donation Platform**  
> Built with **Node.js, Express.js, MongoDB (Mongoose), Socket.io, and Firebase Admin SDK**.

[![Node.js Version](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20ODM-brightgreen.svg)](https://mongoosejs.com/)
[![Socket.io](https://img.shields.io/badge/WebSockets-Socket.io%204.x-black.svg)](https://socket.io/)
[![Firebase](https://img.shields.io/badge/Push%20Notifications-Firebase%20FCM-orange.svg)](https://firebase.google.com/)
[![Swagger Docs](https://img.shields.io/badge/API%20Docs-Swagger%20UI-yellow.svg)](http://localhost:5050/api-docs)

---

## 🌟 Highlights & Features

- **Modular RESTful Architecture**: Clean MVC folder structure (Controllers, Routes, Models, Middlewares, Services, Sockets).
- **Mongoose Data Modeling**: Robust schemas for `Users`, `Causes`, `Campaigns`, `Donations`, and `Notifications` with virtuals and indexes.
- **Dual Authentication**: Secure JWT (JSON Web Tokens) with bcrypt password hashing + Firebase Auth ID token verification.
- **Real-Time WebSockets**: Powered by **Socket.io** — when any donation occurs, all connected clients immediately receive real-time campaign progress bar updates without refreshing.
- **Admin Verification Flow**: NGOs can submit causes; platform Administrators inspect and verify or reject causes before campaigns can be launched.
- **Firebase Push Notifications**: Firebase Cloud Messaging (FCM) integration to dispatch instant donation receipts to donor devices (with simulated mock fallback for local offline testing).
- **Section 80G Tax Exemption Receipts**: Generates authentic Indian Income Tax Section 80G tax certificates with unique receipt numbers and 50% deduction calculations.
- **Interactive Live Dashboard**: Built-in testbench at `http://localhost:5050` with live Socket.io progress bars, role switcher, and donation modal for interactive testing.
- **Interactive Swagger Documentation**: Live API documentation and interactive test runner at `/api-docs`.
- **Postman Collection**: Export-ready `postman_collection.json` with preconfigured environments and sample payloads.

---

## 🏗️ System Architecture

```text
                        ┌──────────────────────────────────────────────┐
                        │      Client (Browser / Mobile / Postman)     │
                        └───────┬───────────────────────────────▲──────┘
                                │                               │
                   REST (HTTP)  │                               │ WebSockets (Socket.io)
                                ▼                               │
                        ┌───────────────────────────────────────┴──────┐
                        │              Node.js + Express               │
                        │       PORT: 5050 | CORS | Morgan Logger       │
                        └───────┬──────────────┬──────────────┬────────┘
                                │              │              │
                   Auth / RBAC  │              │ Business     │ Real-time Events
                                ▼              ▼              ▼
                     ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
                     │ JWT & Firebase│ │ Controllers  │ │  Socket.io   │
                     │  Middlewares  │ │  & Services  │ │  Broadcaster │
                     └───────┬───────┘ └───────┬──────┘ └───────┬──────┘
                             │                 │                │
                             ▼                 ▼                ▼
                     ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
                     │    MongoDB    │ │Firebase FCM  │ │ Live Progress│
                     │ (Mongoose ODM)│ │Push Receipts │ │    Updates   │
                     └───────────────┘ └──────────────┘ └──────────────┘
```

---

## 📂 Project Structure

```text
giveeasy-backend/
├── package.json
├── .env.example
├── .env
├── server.js                        # HTTP + Socket.io Server Entrypoint
├── Dockerfile                       # Production Docker image
├── render.yaml                      # Render Cloud Deployment Blueprint
├── postman_collection.json          # Postman Collection
├── test_api.js                      # 18-step Automated Test Suite
├── README.md                        # Project Documentation
├── public/
│   └── index.html                   # Live Testbench & Interactive UI
└── src/
    ├── app.js                       # Express App & Route Setup
    ├── config/
    │   ├── db.js                    # MongoDB Mongoose Connection
    │   ├── firebase.js              # Firebase Admin SDK & Push Mock
    │   └── swagger.js               # Swagger OpenAPI Specification
    ├── models/
    │   ├── User.js                  # User Schema (bcrypt & JWT)
    │   ├── Cause.js                 # NGO Cause Schema & Verification
    │   ├── Campaign.js              # Campaign Schema & Progress Virtuals
    │   ├── Donation.js              # Donation Transactions & Tax Receipts
    │   └── Notification.js          # In-app & FCM Notification History
    ├── middlewares/
    │   ├── auth.js                  # JWT & Firebase Token Verifier
    │   ├── roles.js                 # Role-Based Access Control (RBAC)
    │   ├── validator.js             # express-validator Input Rules
    │   └── errorHandler.js          # Centralized Global Error Handler
    ├── controllers/
    │   ├── authController.js        # Register, Login, Profile
    │   ├── causeController.js       # Submit, List, Admin Verify Cause
    │   ├── campaignController.js    # Browse, Create, Update Campaigns
    │   ├── donationController.js    # Make Donation, Realtime Emit, 80G
    │   ├── adminController.js       # Administrative Financial Analytics
    │   └── notificationController.js# Push Notifications & Inbox
    ├── routes/
    │   ├── authRoutes.js            # /api/auth
    │   ├── causeRoutes.js           # /api/causes
    │   ├── campaignRoutes.js        # /api/campaigns
    │   ├── donationRoutes.js        # /api/donations
    │   ├── adminRoutes.js           # /api/admin
    │   └── notificationRoutes.js    # /api/notifications
    ├── services/
    │   ├── notificationService.js   # FCM Dispatch & DB Storage
    │   └── receiptService.js        # 80G Tax Exemption Certificate Gen
    ├── sockets/
    │   └── socketHandler.js         # Socket.io Rooms & Event Broadcast
    └── seed/
        └── seeder.js                # Database Seeder with Realistic Data
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas URI)

### 2. Installation
```bash
git clone <repo-url>
cd giveeasy-backend
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
PORT=5050
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/giveeasy
JWT_SECRET=giveeasy_super_secret_jwt_key_2026_production_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5050
```

### 4. Seed the Database
Populates mock users, causes, campaigns, donations, and notifications:
```bash
npm run seed
```

### 5. Start the Server
```bash
# Development mode with Nodemon:
npm run dev

# Or standard production mode:
npm start
```

Server endpoints:
- **Interactive UI Dashboard**: [http://localhost:5050](http://localhost:5050)
- **Swagger Documentation**: [http://localhost:5050/api-docs](http://localhost:5050/api-docs)
- **Health Check API**: [http://localhost:5050/api/health](http://localhost:5050/api/health)

### 6. Run Automated Test Suite
Executes all 18 automated tests including real Socket.io events:
```bash
npm test
```

---

## 🔑 Default Seed Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Super Admin** | `admin@giveeasy.org` | `admin123` | Verify causes, create campaigns, view financial analytics |
| **NGO Representative** | `ngo@careindia.org` | `ngo123` | Submit causes, launch campaigns |
| **Donor** | `priya@example.com` | `donor123` | Browse, donate, download 80G tax receipts |

---

## 📡 API Endpoints Reference

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new donor or NGO admin |
| `POST` | `/api/auth/login` | Public | Login and receive signed JWT token |
| `GET` | `/api/auth/me` | Private | Fetch logged-in user profile |
| `PUT` | `/api/auth/profile` | Private | Update phone, PAN number, or FCM token |

### 2. Campaigns (`/api/campaigns`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/campaigns` | Public | Browse campaigns with pagination, filters (`category`, `search`, `sort`) |
| `GET` | `/api/campaigns/:id` | Public | Single campaign details + recent donors |
| `POST` | `/api/campaigns` | Admin/NGO | Create campaign (requires verified Cause) |
| `PUT` | `/api/campaigns/:id` | Admin/NGO | Update campaign details or status |
| `DELETE` | `/api/campaigns/:id` | Admin | Delete campaign |

### 3. Causes (`/api/causes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/causes` | Public/Admin | Public sees verified causes; Admin sees all |
| `GET` | `/api/causes/:id` | Public | Cause details with linked campaigns |
| `POST` | `/api/causes` | Admin/NGO | Submit a new cause for verification |
| `PUT` | `/api/causes/:id` | Admin Only | Admin approves (`verified`) or rejects cause |

### 4. Donations (`/api/donations`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/donations` | Public/Auth | Make a donation (triggers Socket.io update & Firebase push receipt) |
| `GET` | `/api/donations` | Public | List donations |
| `GET` | `/api/donations/user/:id` | Private | Donation history for specific user |
| `GET` | `/api/donations/:id/receipt` | Public/Donor | Download 80G Tax Exemption Certificate |
| `PUT` | `/api/donations/:id/recurring` | Private | Pause, resume, or cancel recurring donation |

### 5. Admin Analytics (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/campaigns` | Admin Only | Administrative overview with funding metrics |
| `GET` | `/api/admin/donations` | Admin Only | Financial analytics & payment method breakdown |
| `GET` | `/api/admin/overview` | Admin Only | High-level platform KPIs |

### 6. Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/notifications/send` | Public/Auth | Send Firebase push notification |
| `GET` | `/api/notifications` | Public/Auth | Get notification history |
| `PUT` | `/api/notifications/:id/read` | Private | Mark notification as read |

---

## ⚡ Real-Time Socket.io Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join_campaign` | Client ➔ Server | `campaignId` | Subscribe to a specific campaign room |
| `campaign:progress_updated` | Server ➔ Client | `{ campaignId, raisedAmount, targetAmount, percentageRaised, donorCount, latestDonation }` | Broadcasted on every successful donation |
| `cause:status_updated` | Server ➔ Client | `{ causeId, title, status, ngoName }` | Broadcasted when an Admin approves/rejects a cause |
| `notification:global` | Server ➔ Client | `{ title, body, dataPayload }` | Real-time push notification toast |

---

## 📜 Section 80G Tax Receipt Format

Every donation generates a legal **Form 10BE / Section 80G Tax Exemption Certificate**:
```json
{
  "receiptHeader": {
    "organizationName": "Care India Foundation",
    "regNumber": "12A/80G/DEL/2019/CARE99",
    "taxExemptionSection": "Section 80G (5)(vi) of the Income Tax Act, 1961"
  },
  "receiptDetails": {
    "receiptNumber": "GE-2026-401083",
    "transactionId": "TXN_SEED_001_A9B",
    "dateOfDonation": "30 Sep 2026",
    "amountReceived": 5000,
    "amountInWords": "Five Thousand Rupees Only",
    "eligibleTaxDeductionAmount": 2500,
    "deductionRate": "50%"
  },
  "donorDetails": {
    "donorName": "Priya Verma",
    "panNumber": "ABCDE1234F"
  }
}
```

---

## 🧪 Testing with Postman

1. Open Postman.
2. Click **Import** and select `postman_collection.json`.
3. Set the collection variable `baseUrl` to `http://localhost:5050`.
4. Run the **Login (Admin)** request — the test script automatically sets `{{token}}` for subsequent authenticated requests!
