const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports = async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
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
    console.error('Error verifying Google token:', error);
    res.status(400).json({
      success: false,
      message: 'Token tidak valid atau telah kadaluarsa'
    });
  }
};