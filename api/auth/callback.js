const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports = async (req, res) => {
  try {
    console.log('Memproses callback login Google...');
    
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log('User yang login:', payload.email);

    // Buat JWT token
    const userToken = jwt.sign(
      {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      token: userToken,
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture
      }
    });
  } catch (error) {
    console.error('Error saat verifikasi token Google:', error);
    res.status(400).json({
      success: false,
      message: 'Autentikasi gagal: ' + error.message
    });
  }
};