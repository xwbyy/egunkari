const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  try {
    let token;
    
    // Cek token dari header atau body
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.body.token) {
      token = req.body.token;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.status(200).json({
      success: true,
      user: decoded
    });
  } catch (error) {
    console.error('Error verifikasi token:', error);
    
    let message = 'Token tidak valid';
    if (error.name === 'TokenExpiredError') {
      message = 'Sesi telah berakhir, silakan login kembali';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Token tidak valid';
    }

    res.status(401).json({
      success: false,
      message: message
    });
  }
};