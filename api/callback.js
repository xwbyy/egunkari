const axios = require('axios');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send('Authorization code is required');
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, BASE_URL } = process.env;

    // Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/api/callback`,
        grant_type: 'authorization_code',
      }
    });

    const accessToken = tokenRes.data.access_token;

    // Get user profile
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Create JWT
    const token = jwt.sign({
      name: profileRes.data.name,
      email: profileRes.data.email,
      picture: profileRes.data.picture
    }, JWT_SECRET, { expiresIn: '1h' });

    // Set cookie and redirect
    res.cookie('token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
      path: '/'
    });
    
    res.redirect('/dashboard');

  } catch (error) {
    console.error("Callback Error:", error.response?.data || error.message);
    res.status(500).send(`
      <h1>Login Error</h1>
      <p>${error.message}</p>
      <a href="/">Back to Home</a>
    `);
  }
};