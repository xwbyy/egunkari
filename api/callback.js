const axios = require('axios');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  try {
    const code = req.query.code;
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, BASE_URL } = process.env;

    if (!code) throw new Error("No authorization code provided");

    // Step 1: Dapatkan access token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/api/callback`,
        grant_type: 'authorization_code',
      },
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("No access token received");

    // Step 2: Ambil profil user dari Google
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const user = profileRes.data;
    if (!user || !user.email) throw new Error("User profile not found");

    // Step 3: Buat JWT
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });

    // Step 4: Simpan cookie dan redirect
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    res.writeHead(302, { Location: '/dasboard.html' }); // ganti sesuai nama file
    res.end();

  } catch (error) {
    console.error("Error in /api/callback:", error.message, error.response?.data || '');
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
};
