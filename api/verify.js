// api/verify.js
const jwt = require('jsonwebtoken');
const settings = require('../settings');

module.exports = (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, settings.JWT_SECRET);
    res.json({ user: decoded.user });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};