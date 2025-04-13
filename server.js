require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const admin = require('firebase-admin');
const settings = require('./settings');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: settings.FIREBASE_PROJECT_ID,
    clientEmail: `firebase-adminsdk@${settings.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }),
  databaseURL: `https://${settings.FIREBASE_PROJECT_ID}.firebaseio.com`
});

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: settings.BASE_URL,
  credentials: true
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/callback', async (req, res) => {
  try {
    const { code } = req.query;

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: settings.GOOGLE_CLIENT_ID,
      client_secret: settings.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: `${settings.BASE_URL}/api/callback`,
      grant_type: 'authorization_code'
    });

    const { access_token, id_token } = tokenResponse.data;

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const user = {
      id: userResponse.data.sub,
      name: userResponse.data.name,
      email: userResponse.data.email,
      picture: userResponse.data.picture,
      provider: 'google'
    };

    const token = jwt.sign({ user }, settings.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: settings.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'lax',
      path: '/'
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error.response ? error.response.data : error.message);
    res.redirect('/?error=auth_failed');
  }
});

// Firebase Login Endpoint
app.post('/api/firebase-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userRecord = await admin.auth().getUser(decodedToken.uid);

    const user = {
      id: userRecord.uid,
      name: userRecord.displayName || userRecord.email.split('@')[0],
      email: userRecord.email,
      picture: userRecord.photoURL || '/static/default-profile.png',
      provider: 'firebase'
    };

    const token = jwt.sign({ user }, settings.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: settings.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'lax',
      path: '/'
    });

    res.json({ success: true, redirect: '/dashboard' });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const PORT = settings.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${settings.NODE_ENV || 'development'}`);
});