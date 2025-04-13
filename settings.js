// settings.js
module.exports = {
  // Google OAuth
  GOOGLE_CLIENT_ID: "1054339746495-1oiv1uf35qqcbjk63r1epda3s5ap7st8.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "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",
  JWT_SECRET: "rahasia_sangat_rahasia_123",
  BASE_URL: "https://egunkarii.vercel.app",
  
  // Firebase
  FIREBASE_API_KEY: "AIzaSyARC1rM9Hv0cN0SA7ghiszVnuPuolpoHXY",
  FIREBASE_AUTH_DOMAIN: "egunkari-22fcb.firebaseapp.com",
  FIREBASE_PROJECT_ID: "egunkari-22fcb",
  FIREBASE_STORAGE_BUCKET: "egunkari-22fcb.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: "1023582590091",
  FIREBASE_APP_ID: "1:1023582590091:web:762e77a8f8e04acbb6708e",
  FIREBASE_MEASUREMENT_ID: "G-TSSKT7E60W",
  FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  FIREBASE_CLIENT_EMAIL: `firebase-adminsdk@egunkari-22fcb.iam.gserviceaccount.com`,
  
  // Aplikasi
  APP_NAME: "Egunkari",
  APP_DESCRIPTION: "Platform baca dan tulis cerita modern",
  APP_VERSION: "1.0.0",
  NODE_ENV: "production",
  PORT: process.env.PORT || 3000
};