const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Token not found' });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ user });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};