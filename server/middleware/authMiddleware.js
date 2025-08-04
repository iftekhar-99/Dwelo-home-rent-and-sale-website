import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT token verification middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Role-based access control middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Specific role middlewares
export const requireBuyer = authorizeRoles('buyer');
export const requireRenter = authorizeRoles('renter');
export const requireOwner = authorizeRoles('owner');
export const requireAdmin = authorizeRoles('admin');
export const requireSuperAdmin = authorizeRoles('admin'); // Will be refined with admin level check

// Admin level authorization middleware
export const authorizeAdminLevel = (requiredLevel) => {
  return async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      // Import Admin model dynamically to avoid circular dependency
      const Admin = (await import('../models/Admin.js')).default;
      const admin = await Admin.findOne({ userId: req.user.userId });
      
      if (!admin) {
        return res.status(403).json({
          success: false,
          message: 'Admin profile not found'
        });
      }

      const adminLevels = {
        'moderator': 1,
        'admin': 2,
        'super_admin': 3
      };

      if (adminLevels[admin.adminLevel] < adminLevels[requiredLevel]) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required admin level: ${requiredLevel}`
        });
      }

      req.admin = admin;
      next();
    } catch (error) {
      console.error('Admin authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

// Optional authentication middleware (for public routes that can work with or without auth)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = {
            userId: user._id,
            email: user.email,
            role: user.role,
            name: user.name
          };
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log('Optional auth: Invalid token provided');
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
};

// Rate limiting middleware for auth routes
export const authRateLimit = (req, res, next) => {
  // This would typically use a rate limiting library like express-rate-limit
  // For now, we'll implement a basic version
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Store rate limit data in memory (in production, use Redis)
  if (!req.app.locals.rateLimit) {
    req.app.locals.rateLimit = new Map();
  }
  
  const rateLimitData = req.app.locals.rateLimit.get(clientIP) || {
    count: 0,
    resetTime: now + 15 * 60 * 1000 // 15 minutes
  };
  
  if (now > rateLimitData.resetTime) {
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + 15 * 60 * 1000;
  }
  
  rateLimitData.count++;
  req.app.locals.rateLimit.set(clientIP, rateLimitData);
  
  // Allow 5 attempts per 15 minutes
  if (rateLimitData.count > 5) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.'
    });
  }
  
  next();
};

// Logging middleware for auth actions
export const authLogging = (action) => {
  return (req, res, next) => {
    const logData = {
      action,
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      userId: req.user?.userId || null
    };
    
    console.log('Auth Action:', logData);
    next();
  };
};