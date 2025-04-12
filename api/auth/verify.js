const jwt = require('jsonwebtoken');

module.exports = {
  verify: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1] || req.body.token;
      if (!token) throw new Error('Token tidak ditemukan');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({ success: true, user: decoded });
    } catch (error) {
      console.error('Error:', error);
      res.status(401).json({
        success: false,
        message: error.name === 'TokenExpiredError' ? 
          'Sesi telah berakhir' : 'Token tidak valid'
      });
    }
  }
};