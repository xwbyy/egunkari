// callback.js - untuk handle kode dari Google setelah login
const axios = require('axios');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  try {
    const code = req.query.code;
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, BASE_URL } = process.env;

    // Step 1: Tukar code dengan access token
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

    // Step 2: Ambil data user dari Google
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Step 3: Buat JWT
    const token = jwt.sign(profileRes.data, JWT_SECRET, { expiresIn: '1h' });

    // Step 4: Simpan JWT di cookie & redirect ke dashboard
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    res.writeHead(302, { Location: '/dasboard.html' }); // Pastikan ini sesuai nama file
    res.end();

  } catch (error) {
    console.error("Callback Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
};