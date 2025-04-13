require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const admin = require('firebase-admin');
const settings = require('./settings');

// Initialize Firebase Admin dengan error handling
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: settings.FIREBASE_PROJECT_ID,
      clientEmail: settings.FIREBASE_CLIENT_EMAIL,
      privateKey: settings.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: `https://${settings.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('🔥 Firebase Admin Error:', error);
  process.exit(1);
}

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: settings.BASE_URL,
  credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Google OAuth Callback
app.get('/api/callback', async (req, res) => {
  try {
    const { code } = req.query;

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: settings.GOOGLE_CLIENT_ID,
      client_secret: settings.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: `${settings.BASE_URL}/api/callback`,
      grant_type: 'authorization_code'
    });

    // Get user info
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });

    // Create JWT
    const token = jwt.sign({
      user: {
        id: userResponse.data.sub,
        name: userResponse.data.name,
        email: userResponse.data.email,
        picture: userResponse.data.picture,
        provider: 'google'
      }
    }, settings.JWT_SECRET, { expiresIn: '1h' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: settings.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'lax'
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.redirect('/?error=auth_failed');
  }
});

// Firebase Login Endpoint
app.post('/api/firebase-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decodedToken.uid);

    // Generate JWT
    const token = jwt.sign({
      user: {
        id: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        picture: user.photoURL || '/static/default-avatar.png',
        provider: 'firebase'
      }
    }, settings.JWT_SECRET, { expiresIn: '1h' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: settings.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'lax'
    });

    res.json({ success: true, redirect: '/dashboard' });
  } catch (error) {
    console.error('Firebase Login Error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Verification Endpoint
app.get('/api/verify', (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    const decoded = jwt.verify(token, settings.JWT_SECRET);
    res.json({ user: decoded.user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// HTML Routes
app.get('/dashboard', (req, res) => {
  if (!req.cookies.token) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = settings.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${settings.NODE_ENV}`);
});