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

// API Callback Route
app.get('/api/callback', async (req, res) => {
  try {
    console.log('Received callback with code:', req.query.code);
    
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
    console.log('Received tokens from Google');

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

    console.log('User info:', user);

    // Create JWT
    const token = jwt.sign({ user }, settings.JWT_SECRET, { expiresIn: '1h' });

    // Set cookie and redirect
    res.cookie('token', token, {
      httpOnly: true,
      secure: settings.NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
      sameSite: 'lax',
      path: '/'
    });

    console.log('Redirecting to dashboard');
    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error.response ? error.response.data : error.message);
    res.redirect('/?error=auth_failed');
  }
});

// Verify Token Route
app.get('/api/verify', (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      console.log('No token found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, settings.JWT_SECRET);
    console.log('Token verified for user:', decoded.user.email);
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
  console.log('404 Not Found:', req.url);
  res.status(404).send('Not Found');
});

const PORT = settings.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${settings.NODE_ENV || 'development'}`);
  console.log(`Base URL: ${settings.BASE_URL}`);
});
