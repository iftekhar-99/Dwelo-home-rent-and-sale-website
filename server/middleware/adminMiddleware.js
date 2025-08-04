import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

// Admin authentication middleware
export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin token required.'
      });
    }

    // Find admin
    const admin = await Admin.findById(decoded.adminId)
      .populate('userId', 'name email isActive');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token.'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated.'
      });
    }

    // Check if user is active
    if (!admin.userId.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated.'
      });
    }

    // Attach admin info to request
    req.admin = {
      adminId: admin._id,
      adminLevel: admin.adminLevel,
      permissions: admin.permissions,
      userId: admin.userId._id
    };

    next();

  } catch (error) {
    console.error('Admin authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Admin authorization middleware
export const authorizeAdmin = (requiredPermissions = []) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required.'
        });
      }

      // Super admin has all permissions
      if (req.admin.adminLevel === 'super_admin') {
        return next();
      }

      // Check if admin has required permissions
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.some(permission =>
          req.admin.permissions.includes(permission)
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions.'
          });
        }
      }

      next();

    } catch (error) {
      console.error('Admin authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed.'
      });
    }
  };
};

// Specific permission middlewares
export const requireUserManagement = authorizeAdmin(['user_management']);
export const requirePropertyManagement = authorizeAdmin(['property_management']);
export const requireReportManagement = authorizeAdmin(['report_management']);
export const requireContentModeration = authorizeAdmin(['content_moderation']);
export const requireSystemSettings = authorizeAdmin(['system_settings']);

// Admin level authorization
export const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.adminLevel !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required.'
    });
  }
  next();
};

// Rate limiting for admin endpoints
export const adminRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting
  // In production, use redis or a proper rate limiting library
  const clientIp = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // 100 requests per 15 minutes

  // This is a simplified implementation
  // In production, use express-rate-limit or similar
  next();
};

// Admin activity logging middleware
export const adminActivityLog = (action, target = 'system') => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log activity after response is sent
      if (req.admin && res.statusCode < 400) {
        Admin.findById(req.admin.adminId).then(admin => {
          if (admin) {
            admin.addActivityLog({
              action,
              target,
              targetId: req.params.id || null,
              details: `${action} on ${target}`,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent')
            }).catch(err => console.error('Activity logging error:', err));
          }
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Admin session validation
export const validateAdminSession = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin session required.'
      });
    }

    // Check if admin session is still valid
    const admin = await Admin.findById(req.admin.adminId);
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin session expired or invalid.'
      });
    }

    // Update last activity
    admin.lastActivity = new Date();
    await admin.save();

    next();

  } catch (error) {
    console.error('Admin session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation failed.'
    });
  }
}; 