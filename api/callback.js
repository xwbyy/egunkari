// api/callback.js
const axios = require('axios');
const jwt = require('jsonwebtoken');
const settings = require('../settings');

module.exports = async (req, res) => {
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
};