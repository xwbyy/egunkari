const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
  const cookie = req.headers.cookie || '';
  const token = cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ user });
  } catch (e) {
    res.status(401).json({ error: 'Token tidak valid' });
  }
};