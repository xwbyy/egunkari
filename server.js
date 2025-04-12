require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const settings = require('./settings');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
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

    const { access_token, id_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const user = {
      id: userResponse.data.sub,
      name: userResponse.data.name,
      email: userResponse.data.email,
      picture: userResponse.data.picture
    };

    // Create JWT
    const token = jwt.sign({ user }, settings.JWT_SECRET, { expiresIn: '1h' });

    // Set cookie and redirect
    res.cookie('token', token, {
      httpOnly: true,
      secure: settings.NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
      sameSite: 'lax'
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error.response ? error.response.data : error.message);
    res.redirect('/?error=auth_failed');
  }
});

app.get('/api/verify', (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, settings.JWT_SECRET);
    res.json({ user: decoded.user });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// HTML Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Privacy and Terms routes
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
  res.status(404).send('Not Found');
});

const PORT = settings.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${settings.NODE_ENV || 'development'}`);
});
