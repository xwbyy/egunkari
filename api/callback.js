const axios = require('axios');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) throw new Error("No code provided");

    const {
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      JWT_SECRET,
      BASE_URL
    } = process.env;

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/api/callback`,
        grant_type: 'authorization_code',
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("Access token not found");

    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const token = jwt.sign(profileRes.data, JWT_SECRET, { expiresIn: '1h' });

    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    res.writeHead(302, { Location: '/dasboard.html' });
    res.end();

  } catch (error) {
    console.error("Error in callback:", error.message, error.response?.data || '');
    res.status(500).send("Internal Server Error: " + (error.response?.data?.error_description || error.message));
  }
};
