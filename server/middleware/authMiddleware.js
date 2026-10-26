const User = require('../models/User');
const { verifyToken } = require('../utils/auth');

/**
 * Middleware to protect routes and verify Bearer JWT token
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied: Authentication token required'
    });
  }

  try {
    const decoded = verifyToken(token);
    
    // Attempt to locate in MongoDB
    let user = null;
    try {
      user = await User.findById(decoded.id).select('-password');
    } catch {
      // Degraded/fallback mode if DB is disconnected
    }

    if (!user) {
      // Construct fallback user object from decoded JWT payload
      user = {
        _id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        department: decoded.department || 'Information Technology',
        designation: decoded.designation
      };
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: `Invalid or expired session token: ${err.message}`
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Guard
 * @param  {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden: Requires one of [${roles.join(', ')}] permissions. Current role: ${req.user ? req.user.role : 'Unauthenticated'}`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
