const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'AUTH_NO_TOKEN'
      });
    }

    // Validate Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid token format. Use Bearer token.',
        code: 'AUTH_INVALID_FORMAT'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token.length < 10) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'AUTH_INVALID_TOKEN'
      });
    }

    // Verify JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        code: 'SERVER_CONFIG_ERROR'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired. Please login again.',
          code: 'AUTH_TOKEN_EXPIRED',
          expiredAt: jwtError.expiredAt
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token. Please login again.',
          code: 'AUTH_TOKEN_INVALID'
        });
      }
      throw jwtError;
    }
    
    // Validate decoded token has required fields
    if (!decoded.userId) {
      return res.status(401).json({ 
        error: 'Invalid token structure',
        code: 'AUTH_INVALID_STRUCTURE'
      });
    }

    // Find user and check if active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found. Token may be invalid.',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    // Check if user account is active (if you have an isActive field)
    if (user.isActive === false) {
      return res.status(403).json({ 
        error: 'Account is deactivated',
        code: 'AUTH_ACCOUNT_DEACTIVATED'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    req.tokenIssuedAt = decoded.iat;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({ 
      error: 'Authentication error. Please try again.',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = auth;
