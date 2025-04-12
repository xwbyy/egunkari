require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const settings = require('./settings');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

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

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const user = {
      id: userResponse.data.sub,
      name: userResponse.data.name,
      email: userResponse.data.email,
      picture: userResponse.data.picture
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
    console.error('OAuth callback error:', error);
    res.redirect('/?error=auth_failed');
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

// Dynamic HTML route mapping
fs.readdirSync(path.join(__dirname, 'public')).forEach(file => {
  if (file.endsWith('.html')) {
    const routePath = '/' + file.replace('.html', '');
    app.get(routePath === '/index' ? '/' : routePath, (req, res) => {
      // Khusus untuk dashboard, cek token dulu
      if (routePath === '/dashboard') {
        const token = req.cookies.token;
        if (!token) return res.redirect('/');
      }
      res.sendFile(path.join(__dirname, 'public', file));
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const PORT = settings.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${settings.NODE_ENV || 'development'}`);
});
