const axios = require('axios');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  try {
    console.log('Callback initiated with code:', req.query.code);
    
    if (!req.query.code) {
      return res.status(400).send('Authorization code is required');
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, BASE_URL } = process.env;

    // 1. Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code: req.query.code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${BASE_URL}/api/callback`,
      grant_type: 'authorization_code',
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('Access token received');

    // 2. Get user profile
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('User profile fetched:', profileResponse.data.email);

    // 3. Create JWT
    const userPayload = {
      name: profileResponse.data.name,
      email: profileResponse.data.email,
      picture: profileResponse.data.picture
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });

    // 4. Set cookie and redirect
    res.setHeader('Set-Cookie', [
      `token=${token}; Path=/; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; SameSite=None' : 'SameSite=Lax'}; Max-Age=3600`
    ]);

    console.log('Redirecting to dashboard');
    res.redirect(302, '/dashboard');

  } catch (error) {
    console.error("Callback Error:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Error</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <div class="container">
          <h1>Login Error</h1>
          <p>${error.message}</p>
          <a href="/" class="button">Try Again</a>
        </div>
      </body>
      </html>
    `);
  }
};
