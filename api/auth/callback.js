const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports = {
  auth: async (req, res) => {
    try {
      const ticket = await client.verifyIdToken({
        idToken: req.body.token,
        audience: process.env.GOOGLE_CLIENT_ID
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

      res.json({
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
      console.error('Error:', error);
      res.status(400).json({
        success: false,
        message: 'Autentikasi gagal'
      });
    }
  }
};