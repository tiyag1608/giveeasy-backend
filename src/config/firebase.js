const admin = require('firebase-admin');

let firebaseInitialized = false;

// Check if credentials are supplied via environment variables
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines if passed in env
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK Initialized Successfully');
  } catch (error) {
    console.warn(`⚠️ Firebase Admin initialization failed: ${error.message}. Running in Mock Push Notification mode.`);
  }
} else {
  console.log('ℹ️ Firebase credentials not provided in .env - Running with built-in Firebase Simulation/Mock Provider');
}

/**
 * Send push notification (uses real FCM if configured, or mock emulator)
 * @param {string} token - FCM device token
 * @param {object} payload - { title, body, data }
 */
const sendPushNotification = async ({ token, title, body, data = {} }) => {
  if (firebaseInitialized && token) {
    try {
      const message = {
        token,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      };
      const response = await admin.messaging().send(message);
      return { success: true, messageId: response, provider: 'fcm' };
    } catch (err) {
      console.error('Firebase FCM Send Error:', err.message);
      return { success: false, error: err.message, provider: 'fcm' };
    }
  }

  // Graceful Mock for local testing & Viva demonstration
  const simulatedId = `mock_fcm_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  console.log(`[Firebase Push Notification Simulated]`);
  console.log(`  To Token: ${token || 'All/Broadcast'}`);
  console.log(`  Title:    ${title}`);
  console.log(`  Body:     ${body}`);
  console.log(`  Data:     `, data);

  return {
    success: true,
    messageId: simulatedId,
    provider: 'simulated_firebase',
    details: { title, body, data }
  };
};

/**
 * Verify Firebase ID Token (for Firebase Auth)
 */
const verifyFirebaseToken = async (idToken) => {
  if (firebaseInitialized) {
    return await admin.auth().verifyIdToken(idToken);
  }
  // Mock validation for test / viva demonstration
  if (idToken && idToken.startsWith('mock_fb_')) {
    return {
      uid: 'firebase_mock_uid_' + idToken.replace('mock_fb_', ''),
      email: 'firebase_user@giveeasy.org',
      name: 'Firebase Verified User',
    };
  }
  throw new Error('Firebase Admin SDK not initialized with real credentials, and token is not a recognized mock token');
};

module.exports = {
  admin,
  firebaseInitialized,
  sendPushNotification,
  verifyFirebaseToken,
};
