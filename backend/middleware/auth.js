const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

// Check if user has specific permission
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next(); // Admin has all permissions
    }
    
    if (req.user && req.user.permissions && req.user.permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ 
        message: `Access denied: Requires '${permission}' permission` 
      });
    }
  };
};

// Check if user is HR or Admin
const hrOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || 
      (req.user.department === 'HR' && req.user.role === 'staff'))) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: HR or Admin only' });
  }
};

module.exports = { protect, adminOnly, hasPermission, hrOrAdmin };
