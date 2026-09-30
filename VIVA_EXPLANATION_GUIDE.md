# 🎓 GiveEasy Backend Project - Complete Viva Preparation & Explanation Guide

> **Project Name**: GiveEasy - Donation Platform Backend  
> **Course / Degree**: B.Tech Computer Science & Engineering (Backend Development)  
> **Tech Stack**: Node.js, Express.js, MongoDB (Mongoose ODM), Socket.io (WebSockets), Firebase Admin SDK (FCM), JWT  

---

## 📌 Table of Contents
1. [30-Second Elevator Pitch (How to Introduce the Project in Viva)](#1-30-second-elevator-pitch)
2. [High-Level Architecture & Design Patterns](#2-high-level-architecture--design-patterns)
3. [Core Technical Stack: Why Did We Choose Each?](#3-core-technical-stack-why-did-we-choose-each)
4. [Step-by-Step Code Flow Walkthrough](#4-step-by-step-code-flow-walkthrough)
   - [A. User Authentication & Authorization Flow](#a-user-authentication--authorization-flow)
   - [B. NGO Cause Submission & Admin Verification Flow](#b-ngo-cause-submission--admin-verification-flow)
   - [C. Donation Processing & Real-Time Socket.io Broadcast Flow](#c-donation-processing--real-time-socketio-broadcast-flow)
   - [D. Firebase Cloud Messaging (FCM) Push Receipt Flow](#d-firebase-cloud-messaging-fcm-push-receipt-flow)
5. [Database Modeling & Mongoose Highlights](#5-database-modeling--mongoose-highlights)
6. [Middlewares Explained](#6-middlewares-explained)
7. [Advanced Features (Extra Marks in Viva!)](#7-advanced-features-extra-marks-in-viva)
8. [Top 25 Viva Questions & Impressive Answers](#8-top-25-viva-questions--impressive-answers)

---

## 1. 30-Second Elevator Pitch

> *"Good morning, Sir/Ma'am. Today I am presenting **GiveEasy**, an enterprise-grade backend RESTful and real-time fundraising platform designed for NGOs and donors.*  
>  
> *The backend is built using **Node.js** and **Express.js** following the **MVC architectural pattern**. It integrates **MongoDB** with **Mongoose ODM** for data persistence across causes, campaigns, donors, and financial transactions.*  
>  
> *Key highlights of our platform include:*  
> 1. *Secure **dual authentication** using signed JWT tokens and Firebase ID tokens with **Role-Based Access Control (RBAC)**.*  
> 2. *An **Admin Verification pipeline** ensuring that only verified NGO causes can launch fundraising campaigns.*  
> 3. *Real-time bidirectional communication via **Socket.io**, where every contribution dynamically updates live campaign progress bars across all connected donors without page refreshes.*  
> 4. *Automated push notification dispatch for donation receipts using **Firebase Cloud Messaging**.*  
> 5. *An Indian Income Tax compliant **Section 80G tax exemption certificate generation** system.*  
>  
> *The entire API is documented via **Swagger/OpenAPI** at `/api-docs` and tested through our automated test suite."*

---

## 2. High-Level Architecture & Design Patterns

### Architectural Pattern: **Layered MVC (Model - View/API - Controller) + Services**
Our project adheres to the **Separation of Concerns (SoC)** principle:

```text
HTTP Request / WebSocket
         │
         ▼
[ Routes Layer ]         ──> Maps URL endpoints to controllers (e.g. /api/donations)
         │
         ▼
[ Middlewares Layer ]    ──> Authenticates JWT, checks RBAC roles, validates input
         │
         ▼
[ Controllers Layer ]    ──> Orchestrates business logic & handles HTTP request/response
         │
         ├───> [ Services Layer ]  ──> Reusable logic (Tax Receipt generation, FCM Push)
         │
         ├───> [ Sockets Layer ]   ──> Real-time room broadcasts (Socket.io)
         │
         ▼
[ Models / DB Layer ]    ──> Mongoose Schemas, validation, indexes, and MongoDB queries
```

### Why is this better than putting everything in `server.js`?
- **Modularity**: Every entity (Auth, Cause, Campaign, Donation, Notification) has its own model, controller, and route.
- **Maintainability**: If payment logic changes, we only touch `donationController.js` and `receiptService.js`.
- **Testability**: Independent unit and integration testing without spinning up the whole monolithic logic.

---

## 3. Core Technical Stack: Why Did We Choose Each?

### 1. Why Node.js?
- **Non-blocking, Asynchronous Event-driven I/O**: Node.js operates on a single-threaded Event Loop using `libuv`. When handling thousands of simultaneous donor socket connections and database queries, it does not spawn a new OS thread per connection (unlike traditional multi-threaded servers like Apache Tomcat), making it lightweight and resource-efficient.
- **High Concurrency**: Perfect for real-time WebSocket communication and high-frequency donation spikes.

### 2. Why Express.js?
- Minimalist, unopinionated framework providing robust routing and middleware pipelining.
- Allows chaining middlewares: `router.post('/', protect, authorize('admin'), validate, controller)`.

### 3. Why MongoDB & Mongoose?
- **Flexible Document Model**: NGO causes have diverse fields (registration documents, impact metrics, tax numbers, audit notes) which map naturally to JSON/BSON documents.
- **Mongoose ODM Benefits**:
  - Strongly typed schema definitions with built-in validators.
  - **Virtual Fields**: E.g., `percentageRaised` is calculated dynamically without bloating the database.
  - **Pre-save Hooks**: Automatically hashing passwords with `bcrypt` before writing to disk.

### 4. Why Socket.io instead of simple HTTP Polling?
- **HTTP Polling**: Client keeps sending requests every 2 seconds (`GET /api/campaigns/123`). This wastes server CPU, consumes bandwidth with HTTP headers, and introduces latency.
- **Socket.io (WebSockets)**: Establishes a persistent, full-duplex TCP connection. When a donation occurs, the server **pushes** data to clients in less than 10 milliseconds. Socket.io also provides automatic reconnection and fallback to HTTP long-polling if firewalls block WebSocket traffic.

### 5. Why Firebase Cloud Messaging (FCM)?
- FCM provides low-latency, battery-efficient mobile and web push notifications.
- In GiveEasy, when a donor contributes, a push notification receipt is sent directly to their device.

---

## 4. Step-by-Step Code Flow Walkthrough

### A. User Authentication & Authorization Flow
1. **Registration**: User hits `POST /api/auth/register`.
   - `validator.js` runs `registerRules` (checks email regex, password >= 6 characters).
   - `User.js` pre-save hook runs `bcrypt.hash(password, 10)` to salt and hash the password.
   - Generates signed JWT using `user.generateAuthToken()` containing `{ id, email, role }`.
2. **Login**: User hits `POST /api/auth/login`.
   - Fetches user including hidden `+password` field.
   - Compares with `user.comparePassword(password)` using `bcrypt.compare`.
   - Returns signed JWT token valid for 7 days.
3. **Protected Requests**:
   - Client sends header: `Authorization: Bearer <token>`.
   - `auth.js` (`protect` middleware) extracts token, verifies signature with `JWT_SECRET`.
   - If valid, fetches user from MongoDB (`select('-password')`) and attaches to `req.user`.
   - Next, `roles.js` (`authorize('admin')`) checks if `req.user.role === 'admin'`. If not, returns `403 Forbidden`.

---

### B. NGO Cause Submission & Admin Verification Flow
1. An NGO representative submits a cause via `POST /api/causes`.
2. The initial status is set to `pending`.
3. An unverified cause **cannot** be used to launch fundraising campaigns (enforced in `campaignController.js`).
4. The Platform Admin inspects the NGO's registration certificates and proof URL.
5. Admin sends `PUT /api/causes/:id` with `{ status: 'verified', verificationNotes: 'Documents verified' }`.
6. `causeController.js` updates `status: 'verified'`, records `verifiedBy: req.user.id`, and `verifiedAt: Date.now()`.
7. `emitCauseStatus()` broadcasts a Socket.io event `cause:status_updated` so the UI updates immediately!

---

### C. Donation Processing & Real-Time Socket.io Broadcast Flow
**This is the most critical flow to explain in your viva:**

1. Donor submits `POST /api/donations` with `{ campaignId, amount: 2500, paymentMethod: 'UPI' }`.
2. `donationController.js` validates that the campaign exists and its status is `active`.
3. Creates a `Donation` document with:
   - Unique Transaction ID: `TXN_...`
   - Unique Receipt Number: `GE-2026-XXXXXX`
4. **Atomic Campaign Update**:
   - `campaign.raisedAmount += amount;`
   - `campaign.donorCount += 1;`
   - If `raisedAmount >= targetAmount`, updates `campaign.status = 'completed'`.
   - Saves to MongoDB.
5. **Real-Time WebSocket Broadcast**:
   - Calls `emitCampaignProgress(campaign, donation)` in `src/sockets/socketHandler.js`.
   - Emits event `campaign:progress_updated` to the room `campaign_${campaignId}` and globally.
   - Connected frontend clients receive the payload and animate their progress bar smoothly to the new percentage!
6. **Firebase Push Notification**:
   - Calls `sendDonationReceiptNotification()`.
   - Dispatches FCM message with receipt number and amount.
   - Saves notification in MongoDB `Notification` collection.
7. Responds with `201 Created` and dynamic link to the official 80G tax receipt: `/api/donations/:id/receipt`.

---

## 5. Database Modeling & Mongoose Highlights

### 1. `User` Schema
- Fields: `name`, `email` (unique, indexed), `password` (hashed, select: false), `role` (`donor`, `admin`, `ngo_admin`), `panNumber` (for tax exemption), `fcmToken`.
- Methods: `comparePassword()`, `generateAuthToken()`.

### 2. `Cause` Schema
- Fields: `title`, `description`, `category`, `ngoName`, `ngoRegistrationNumber`, `contactEmail`, `proofUrl`, `status` (`pending`, `verified`, `rejected`), `verifiedBy` (ref User), `verifiedAt`.
- Virtual: `campaigns` (populates all campaigns under this cause).

### 3. `Campaign` Schema
- Fields: `title`, `description`, `causeId` (ref Cause, required), `targetAmount`, `raisedAmount` (default 0), `donorCount` (default 0), `status` (`active`, `completed`, `paused`), `impactMetric`.
- Virtuals:
  - `percentageRaised`: `((raisedAmount / targetAmount) * 100).toFixed(2)`
  - `remainingAmount`: `targetAmount - raisedAmount`

### 4. `Donation` Schema
- Fields: `donorId` (ref User), `donorName`, `donorEmail`, `campaignId` (ref Campaign), `causeId`, `amount`, `paymentMethod`, `paymentStatus`, `transactionId`, `receiptNumber`, `isRecurring`, `taxReceipt`.
- Indexes: `{ donorId: 1, createdAt: -1 }` and `{ campaignId: 1, createdAt: -1 }` for high-speed queries.

### 5. `Notification` Schema
- Fields: `userId`, `recipientEmail`, `title`, `body`, `type`, `dataPayload`, `fcmMessageId`, `readStatus`.

---

## 6. Middlewares Explained

| Middleware | File | Purpose |
|---|---|---|
| **JWT & Firebase Auth** | `middlewares/auth.js` | Validates Bearer token in headers, checks JWT signature, or falls back to Firebase token verification. Attaches `req.user`. |
| **RBAC Authorization** | `middlewares/roles.js` | Checks `req.user.role` against authorized list (e.g. `authorize('admin')`). Returns 403 Forbidden if unauthorized. |
| **Input Validator** | `middlewares/validator.js` | Uses `express-validator` to sanitize input and prevent SQL/NoSQL injection and bad data types before reaching controllers. |
| **Global Error Handler** | `middlewares/errorHandler.js` | Catches unhandled errors, Mongoose `CastError` (invalid ObjectId), duplicate key error (code 11000), and returns structured JSON responses without crashing the server. |
| **CORS & Morgan** | `src/app.js` | Enables Cross-Origin Resource Sharing and logs HTTP requests with timing in console. |

---

## 7. Advanced Features (Extra Marks in Viva!)

1. **Section 80G Tax Exemption Receipt Generator**:
   - Accessible at `GET /api/donations/:id/receipt`.
   - Generates a Form 10BE compliant certificate calculating the **50% eligible tax deduction** under Indian Income Tax Act 1961, converts amount to words in Indian numbering system (Lakhs/Crores), and provides verification metadata.
2. **Recurring Donations Management**:
   - Supports monthly/quarterly recurring donations with status control (`active`, `paused`, `cancelled`) via `PUT /api/donations/:id/recurring`.
3. **Graceful Firebase Simulator**:
   - If external Firebase credentials are not provided in development, the platform automatically engages a fallback mock emulator that logs push packets and assigns simulated FCM message IDs, ensuring **zero crashes** during offline viva presentation!
4. **Interactive Live Demonstration UI**:
   - Accessible directly at `http://localhost:5050` with live Socket.io donation animations.

---

## 8. Top 25 Viva Questions & Impressive Answers

#### Q1. What is Node.js and how does its architecture work?
**Answer**: Node.js is an open-source, cross-platform JavaScript runtime built on Chrome's V8 engine. It uses an **event-driven, non-blocking I/O model** powered by the **libuv** C++ library. The main JavaScript code runs on a single thread (the Event Loop), while time-consuming tasks like file I/O, DNS lookups, and crypto operations are delegated to libuv's background Worker Pool.

#### Q2. What is the difference between synchronous and asynchronous code in Node.js?
**Answer**: Synchronous code blocks the Event Loop until the operation completes, freezing the server for other clients. Asynchronous code (using Promises or `async/await`) delegates work to the background and returns a callback/promise once complete, allowing the Event Loop to continue processing incoming requests without waiting.

#### Q3. How does JWT (JSON Web Token) authentication work in your project?
**Answer**: A JWT consists of three parts separated by dots: **Header** (algorithm), **Payload** (user ID, role, expiration), and **Signature** (`HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)`).  
When the user logs in, the server generates and signs the token with our `JWT_SECRET`. On subsequent requests, the client sends `Authorization: Bearer <token>`. Our `protect` middleware verifies the cryptographic signature without needing to hit a sessions database, making it completely **stateless and scalable**.

#### Q4. What is the difference between Authentication and Authorization?
**Answer**:
- **Authentication (AuthN)**: Verifying *who you are* (e.g., verifying user email and password or token in `auth.js`).
- **Authorization (AuthZ)**: Verifying *what you have permission to do* (e.g., checking if `req.user.role === 'admin'` in `roles.js`).

#### Q5. Why did you use WebSockets (Socket.io) instead of HTTP REST for campaign updates?
**Answer**: REST is based on the request-response model where the client must initiate every interaction. For live progress bars, clients would have to continuously poll the server every few seconds, causing high server load and network overhead. Socket.io maintains a persistent two-way connection. When a donation occurs, the server instantly **pushes** the new percentage to all connected clients in real time.

#### Q6. What are Socket.io "Rooms" and how did you use them?
**Answer**: Rooms are arbitrary communication channels that sockets can join and leave on the server side. In our application, we created campaign-specific rooms: `socket.join("campaign_" + campaignId)`. When a donation arrives for Campaign A, we emit only to `campaign_A`, avoiding unnecessary broadcasts to clients viewing other campaigns.

#### Q7. How do you prevent passwords from being stored in plain text?
**Answer**: We use the `bcryptjs` library. In our Mongoose `User` schema, we have a `pre('save')` middleware hook that generates a cryptographically secure salt (`genSalt(10)`) and hashes the password before saving to MongoDB. When logging in, `bcrypt.compare(enteredPassword, hashedPassword)` verifies the password without ever needing to decrypt the stored hash.

#### Q8. What is Mongoose and what is the difference between MongoDB and Mongoose?
**Answer**: MongoDB is the NoSQL document database engine itself. Mongoose is an **ODM (Object Data Modeling)** library for Node.js. MongoDB is schema-less by default, but Mongoose enforces application-level schemas, data validation, type casting, middleware hooks, and model virtuals.

#### Q9. What are Mongoose Virtuals? Give an example from your project.
**Answer**: Virtuals are document properties that you can get and set but that are **not** persisted to MongoDB. In our `Campaign` model, `percentageRaised` is a virtual getter:
```javascript
campaignSchema.virtual('percentageRaised').get(function () {
  return Number(((this.raisedAmount / this.targetAmount) * 100).toFixed(2));
});
```
This saves database storage and ensures the percentage is always computed accurately from current amounts.

#### Q10. What are MongoDB Indexes and why did you add them in `Donation.js`?
**Answer**: Without indexes, MongoDB has to scan every single document in a collection (Collection Scan / `COLLSCAN`) to find matching records. An index creates an ordered B-tree structure. We added compound indexes on `{ donorId: 1, createdAt: -1 }` and `{ campaignId: 1, createdAt: -1 }` so fetching a user's donation history or a campaign's top donors is an $O(\log N)$ index scan instead of $O(N)$.

#### Q11. How does your Admin Cause Verification system work?
**Answer**: When an NGO submits a cause, its `status` is initialized as `pending`. Campaigns can **only** be created if their associated cause has `status === 'verified'`. Only an administrator with `role === 'admin'` can access `PUT /api/causes/:id` to approve or reject the cause. Once approved, the admin's ID and timestamp are recorded, and Socket.io broadcasts the status change.

#### Q12. How does Firebase Cloud Messaging (FCM) work in your backend?
**Answer**: We use the official `firebase-admin` SDK. When a donation succeeds, `notificationService.js` constructs an FCM message containing notification title, body, and custom data payload (receipt number, transaction ID). It calls `admin.messaging().send(message)` targeting the donor's device registration token. If Firebase credentials are not provided during local testing, our code safely falls back to a simulated push provider so the application never crashes.

#### Q13. What is the role of `express-validator` in your application?
**Answer**: It acts as validation and sanitization middleware before reaching controllers. For instance, in `donationRules`, it checks that `amount` is a number $\ge 1$, `campaignId` is a valid MongoDB ObjectId, and `donorEmail` is normalized. If any check fails, it immediately returns `400 Bad Request` with field-level error messages, protecting our database from corrupt data and NoSQL injection.

#### Q14. What is CORS and why did you configure it?
**Answer**: CORS stands for **Cross-Origin Resource Sharing**. By default, web browsers block web pages from making HTTP requests to a domain/port different from the one that served the page (Same-Origin Policy). We used the `cors()` middleware in Express and configured Socket.io CORS options to allow frontend clients (like React, Vue, or mobile apps) to communicate with our API.

#### Q15. How do you handle unhandled errors and 404 routes?
**Answer**: We have a centralized error-handling middleware `errorHandler.js` registered at the very end of our middleware chain (`app.use(errorHandler)`). It catches Mongoose `CastError` (invalid ObjectId), duplicate key errors (code 11000), and validation errors, returning clean JSON error responses instead of leaking internal server stack traces to users. A catch-all route handles 404s for non-existent endpoints.

#### Q16. What is the difference between `PUT` and `POST` in REST APIs?
**Answer**:
- `POST`: Used to create a new resource (e.g. `POST /api/donations`). It is typically non-idempotent (sending it twice creates two donations).
- `PUT`: Used to update or replace an existing resource (e.g. `PUT /api/causes/:id` to verify a cause). It is idempotent.

#### Q17. What is an atomic operation in MongoDB and how did you use it?
**Answer**: In `createDonation`, multiple users might donate simultaneously. If two users read `raisedAmount = 1000` and each add 500, a race condition could result in `1500` instead of `2000`. By using Mongoose atomic update operations (`$inc: { raisedAmount: amount, donorCount: 1 }`), MongoDB guarantees thread-safe, atomic increments at the database level.

#### Q18. How does Section 80G Tax Exemption work in your platform?
**Answer**: Under Section 80G of the Indian Income Tax Act 1961, donors can claim a 50% tax deduction on donations made to approved charitable trusts. When a donation is made, our `receiptService.js` records the donor's PAN card number, generates a unique receipt number, calculates the 50% eligible deduction amount, and produces a Form 10BE compliant digital receipt.

#### Q19. What is Swagger and how is it integrated?
**Answer**: Swagger (OpenAPI 3.0) provides interactive API documentation. We integrated `swagger-jsdoc` and `swagger-ui-express` mounted at `/api-docs`. It allows developers and evaluators to inspect all routes, schemas, request payloads, and test endpoints directly from the browser.

#### Q20. What is the difference between `npm install` and `npm ci` in your Dockerfile?
**Answer**: `npm install` reads `package.json` and may update `package-lock.json` with compatible minor versions. `npm ci` (Clean Install) installs the exact dependency tree strictly from `package-lock.json`, ensuring deterministic, identical builds in production containers.

#### Q21. What are Environment Variables and why are they stored in `.env`?
**Answer**: Sensitive credentials like `JWT_SECRET`, database connection URIs, and Firebase private keys should never be hardcoded in source code or pushed to version control. Using the `dotenv` package, we load them into `process.env` at runtime from a local `.env` file, keeping secrets secure.

#### Q22. What happens if MongoDB goes down while the server is running?
**Answer**: Our `db.js` handles connection errors and logs the failure. If the database is unreachable, queries reject with database connection errors caught by our centralized `errorHandler.js`, returning `500 Internal Server Error` without crashing the entire Node process.

#### Q23. What is the Event Loop in Node.js?
**Answer**: The Event Loop is what allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded. It continuously cycles through 6 phases: Timers (`setTimeout`), Pending Callbacks, Idle/Prepare, Poll (I/O events), Check (`setImmediate`), and Close Callbacks.

#### Q24. How did you structure your automated test suite?
**Answer**: In `test_api.js`, we implemented an end-to-end automated test runner covering all 18 requirements from the assignment: health check, authentication tokens, campaign and cause CRUD operations, admin verification, real Socket.io message reception over a live socket client, 80G tax receipt generation, and notification logs.

#### Q25. If this platform grows to 1 million donors, how would you scale it?
**Answer**:
1. **Horizontal Scaling**: Run multiple instances of the Node.js server behind an Nginx or AWS Application Load Balancer.
2. **Socket.io Redis Adapter**: Use a Redis Pub/Sub adapter so WebSocket events emitted on Server Instance 1 are seamlessly relayed to clients connected to Server Instance 2.
3. **Database Scaling**: Implement MongoDB Replica Sets with Read Replicas and Sharding for distributed data partitioning.
4. **Caching**: Cache frequent queries (like active campaigns list) using Redis to reduce database read load.

---

## 🎯 Viva Tips for Getting Maximum Marks

1. **Start by showing the Live Test Dashboard**:
   - Open your browser to `http://localhost:5050`.
   - Show the campaigns list and the real-time Socket.io progress bar.
   - Click **"Donate ₹"** and point out that the progress bar animates immediately, the Socket.io live feed logs the transaction, and the 80G tax receipt pops up automatically!
2. **Show the Admin Verification Flow**:
   - Switch role to **Admin**.
   - Show how the pending cause has an **"Approve & Verify Cause"** button.
   - Click it and show that the status changes to `VERIFIED` and a WebSocket event is broadcasted.
3. **Show the Swagger Documentation**:
   - Navigate to `http://localhost:5050/api-docs` and show the examiner that all endpoints are documented with OpenAPI 3.0 specs.
4. **Run the Automated Test Suite in Terminal**:
   - In terminal, run: `npm test`.
   - Show the examiner: `🎉 TEST SUMMARY: 18 PASSED, 0 FAILED`.
   - This proves that every single feature is 100% verified and functional.
