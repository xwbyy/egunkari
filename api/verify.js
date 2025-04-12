const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
  try {
    // Get token from cookies
    const token = req.cookies?.token || 
                 req.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token found');
      return res.status(401).json({ 
        error: 'Authentication required',
        redirect: '/'
      });
    }

    // Verify token
    const user = jwt.verify(token, process.env.JWT_SECRET);
    console.log('User verified:', user.email);
    
    res.status(200).json({ 
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Session expired',
        redirect: '/'
      });
    }
    
    res.status(401).json({ 
      error: 'Invalid authentication',
      redirect: '/'
    });
  }
};
