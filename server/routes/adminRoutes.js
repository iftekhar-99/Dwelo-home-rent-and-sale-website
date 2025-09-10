import express from 'express';
import {
  adminLogin,
  getDashboardMetrics,
  getPendingProperties,
  approveProperty,
  getAllProperties,
  getPendingReports,
  getPendingPropertyUpdateRequests,
  handlePropertyUpdateRequest,
  handleReport,
  banUser,
  getAdminProfile,
  updateAdminProfile
} from '../controllers/adminController.js';
import {
  authenticateAdmin,
  authorizeAdmin,
  requireUserManagement,
  requirePropertyManagement,
  requireReportManagement,
  requireContentModeration,
  adminRateLimit,
  adminActivityLog,
  validateAdminSession
} from '../middleware/adminMiddleware.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const router = express.Router();

// Admin authentication routes (no auth required)
router.post('/login', adminRateLimit, asyncHandler(adminLogin));

// Protected admin routes (require authentication)
router.use(authenticateAdmin);
router.use(validateAdminSession);

// Dashboard routes
router.get('/dashboard', 
  adminRateLimit, 
  adminActivityLog('view_dashboard', 'dashboard'),
  asyncHandler(getDashboardMetrics)
);

// Property management routes
router.get('/properties/pending',
  requirePropertyManagement,
  adminRateLimit,
  adminActivityLog('view_pending_properties', 'property'),
  asyncHandler(getPendingProperties)
);

router.put('/properties/:propertyId/approve',
  requirePropertyManagement,
  adminRateLimit,
  adminActivityLog('approve_property', 'property'),
  asyncHandler(approveProperty)
);

// Property update request management routes
router.get('/requests/property-update/pending',
  requirePropertyManagement,
  adminRateLimit,
  adminActivityLog('view_pending_property_update_requests', 'property_update_request'),
  asyncHandler(getPendingPropertyUpdateRequests)
);

router.get('/properties/all',
  requirePropertyManagement,
  adminRateLimit,
  adminActivityLog('view_all_properties', 'property'),
  asyncHandler(getAllProperties)
);

router.put('/requests/:requestId/handle-property-update',
  requirePropertyManagement,
  adminRateLimit,
  adminActivityLog('handle_property_update_request', 'property_update_request'),
  asyncHandler(handlePropertyUpdateRequest)
);

// Report management routes
router.get('/reports/pending',
  requireReportManagement,
  adminRateLimit,
  adminActivityLog('view_pending_reports', 'report'),
  asyncHandler(getPendingReports)
);

router.put('/reports/:reportId/handle',
  requireReportManagement,
  adminRateLimit,
  adminActivityLog('handle_report', 'report'),
  asyncHandler(handleReport)
);

// User management routes
router.put('/users/:userId/ban',
  requireUserManagement,
  adminRateLimit,
  adminActivityLog('ban_user', 'user'),
  asyncHandler(banUser)
);

// Admin profile routes
router.get('/profile',
  adminRateLimit,
  adminActivityLog('view_profile', 'admin'),
  asyncHandler(getAdminProfile)
);

router.put('/profile',
  adminRateLimit,
  adminActivityLog('update_profile', 'admin'),
  asyncHandler(updateAdminProfile)
);

// Additional property management routes
router.get('/properties', 
  requirePropertyManagement,
  adminRateLimit,
  adminActivityLog('view_all_properties', 'property'),
  asyncHandler(async (req, res) => {
    // Get all properties with filtering and pagination
    const { page = 1, limit = 20, status, propertyType, listingType } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (status) query.status = status;
    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    
    const properties = await Property.find(query)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Property.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  })
);

// User management routes
router.get('/users',
  requireUserManagement,
  adminRateLimit,
  adminActivityLog('view_all_users', 'user'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, isActive } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  })
);

// Analytics routes
router.get('/analytics/users',
  authorizeAdmin(['analytics_view']),
  adminRateLimit,
  adminActivityLog('view_user_analytics', 'analytics'),
  asyncHandler(async (req, res) => {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          byRole: {
            $push: {
              role: "$role",
              isActive: "$isActive"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        period,
        stats: userStats
      }
    });
  })
);

router.get('/analytics/properties',
  authorizeAdmin(['analytics_view']),
  adminRateLimit,
  adminActivityLog('view_property_analytics', 'analytics'),
  asyncHandler(async (req, res) => {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const propertyStats = await Property.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          byStatus: {
            $push: {
              status: "$status",
              listingType: "$listingType"
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        period,
        stats: propertyStats
      }
    });
  })
);

// System health check
router.get('/health',
  adminRateLimit,
  asyncHandler(async (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      admin: {
        id: req.admin.adminId,
        level: req.admin.adminLevel,
        permissions: req.admin.permissions
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  })
);

export default router;