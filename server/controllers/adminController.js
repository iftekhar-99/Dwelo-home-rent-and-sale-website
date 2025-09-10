import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Property from '../models/Property.js';
import Report from '../models/Report.js';
import Buyer from '../models/Buyer.js';
import Owner from '../models/Owner.js';
import Renter from '../models/Renter.js';
import PropertyUpdateRequest from '../models/PropertyUpdateRequest.js';

// JWT token generation for admin
const generateAdminToken = (adminId, adminLevel) => {
  return jwt.sign(
    { adminId, adminLevel, type: 'admin' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Admin login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email first
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Find admin record for this user
    const admin = await Admin.findOne({ userId: user._id })
      .populate('userId', 'name email isActive');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Check if user is active
    if (!admin.userId.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Update last activity and add login history
    admin.lastActivity = new Date();
    await admin.addLoginHistory({
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    // Generate admin JWT token
    const token = generateAdminToken(admin._id, admin.adminLevel);

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          id: admin._id,
          name: admin.userId.name,
          email: admin.userId.email,
          adminLevel: admin.adminLevel,
          permissions: admin.permissions,
          lastActivity: admin.lastActivity
        },
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed'
    });
  }
};

// Get dashboard metrics
export const getDashboardMetrics = async (req, res) => {
  try {
    const adminId = req.admin.adminId;

    // Get total users by role
    const userMetrics = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    // Get property metrics
    const propertyMetrics = await Property.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get report metrics
    const reportMetrics = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get pending approvals count
    const pendingProperties = await Property.countDocuments({ status: 'pending' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentProperties = await Property.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentReports = await Report.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Format metrics
    const metrics = {
      users: {
        total: userMetrics.reduce((sum, item) => sum + item.count, 0),
        byRole: userMetrics.reduce((acc, item) => {
          acc[item._id] = { total: item.count, active: item.active };
          return acc;
        }, {}),
        recent: recentUsers
      },
      properties: {
        total: propertyMetrics.reduce((sum, item) => sum + item.count, 0),
        byStatus: propertyMetrics.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        pending: pendingProperties,
        recent: recentProperties
      },
      reports: {
        total: reportMetrics.reduce((sum, item) => sum + item.count, 0),
        byStatus: reportMetrics.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        pending: pendingReports,
        recent: recentReports
      }
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics'
    });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const properties = await Property.find({})
      .populate({
        path: 'ownerId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate('approvalDetails.approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Property.countDocuments({});

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

  } catch (error) {
    console.error('Get all properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all properties'
    });
  }
};

// Get pending properties
export const getPendingProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;
    const skip = (page - 1) * limit;

    const properties = await Property.find({ status })
      .populate({
        path: 'ownerId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate('approvalDetails.approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Property.countDocuments({ status });

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

  } catch (error) {
    console.error('Get pending properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending properties'
    });
  }
};

// Approve/reject property
export const approveProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { action, reason, notes } = req.body;
    const adminId = req.admin.adminId;

    const property = await Property.findById(propertyId)
      .populate('ownerId', 'name email');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Property is not pending approval'
      });
    }

    if (action === 'approve') {
      await property.approve(adminId, notes);
    } else if (action === 'reject') {
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      await property.reject(adminId, reason, notes);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }

    // Log admin activity
    const admin = await Admin.findById(adminId);
    if (admin) {
      await admin.addActivityLog({
        action: `property_${action}`,
        target: 'property',
        targetId: property._id,
        details: `${action}ed property: ${property.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.json({
      success: true,
      message: `Property ${action}ed successfully`,
      data: { property }
    });

  } catch (error) {
    console.error('Approve property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process property approval'
    });
  }
};

// Get pending property update requests
export const getPendingPropertyUpdateRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;
    const skip = (page - 1) * limit;

    const requests = await PropertyUpdateRequest.find({ status })
      .populate('propertyId', 'title address images status')
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PropertyUpdateRequest.countDocuments({ status });

    // Also include newly created properties waiting for approval so both are visible in one place
    const pendingNewProperties = await Property.find({ status: 'pending' })
      .populate('ownerId', 'name email phone')
      .select('title price images status createdAt');

    res.json({
      success: true,
      data: {
        requests,
        pendingNewProperties,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get pending property update requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending property update requests'
    });
  }
};

// Handle property update request
export const handlePropertyUpdateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, reason, notes } = req.body;
    const adminId = req.admin.adminId;

    const request = await PropertyUpdateRequest.findById(requestId)
      .populate('propertyId')
      .populate('ownerId', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Property update request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending approval'
      });
    }

    if (action === 'approve') {
      // Apply the updates to the actual property
      const property = request.propertyId;
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Associated property not found'
        });
      }

      // Normalize proposed updates before applying (e.g., images array of strings → array of objects)
      const updates = { ...request.proposedUpdates };
      if (Array.isArray(updates.images)) {
        updates.images = updates.images.map(img =>
          typeof img === 'string' ? { url: img, isPrimary: false } : img
        );
        if (updates.images.length > 0) updates.images[0].isPrimary = true;
      }

      // Merge proposed updates into the property document
      Object.assign(property, updates);
      await property.save();

      request.status = 'approved';
      request.approvedBy = adminId;
      request.approvedAt = new Date();
      request.adminNotes = notes;
      await request.save();

    } else if (action === 'reject') {
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      request.status = 'rejected';
      request.rejectedBy = adminId;
      request.rejectedAt = new Date();
      request.rejectionReason = reason;
      request.adminNotes = notes;
      await request.save();

    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }

    // Log admin activity
    const admin = await Admin.findById(adminId);
    if (admin) {
      await admin.addActivityLog({
        action: `property_update_request_${action}`,
        target: 'property_update_request',
        targetId: request._id,
        details: `${action}ed property update request for property: ${request.propertyId.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.json({
      success: true,
      message: `Property update request ${action}ed successfully`,
      data: { request }
    });

  } catch (error) {
    console.error('Handle property update request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process property update request'
    });
  }
};

// Get pending reports
export const getPendingReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, priority, status = 'pending' } = req.query;
    const skip = (page - 1) * limit;

    const query = { status };
    if (priority) query.priority = priority;

    const reports = await Report.find(query)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reports'
    });
  }
};

// Handle report
export const handleReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, details, resolution, notes } = req.body;
    const adminId = req.admin.adminId;

    const report = await Report.findById(reportId)
      .populate('reportedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Report is already resolved'
      });
    }

    // Add action to report
    await report.addAction({
      action,
      details,
      performedBy: adminId
    });

    // Handle specific actions
    if (action === 'ban_user') {
      const targetUser = await User.findById(report.targetId);
      if (targetUser) {
        targetUser.isActive = false;
        await targetUser.save();
      }
    } else if (action === 'delete_content') {
      if (report.targetType === 'Property') {
        const property = await Property.findById(report.targetId);
        if (property) {
          property.isActive = false;
          await property.save();
        }
      }
    }

    // Resolve report if action is taken
    if (['ban_user', 'delete_content', 'warn_user', 'no_action'].includes(action)) {
      await report.resolve(adminId, resolution || 'action_taken', notes);
    }

    // Log admin activity
    const admin = await Admin.findById(adminId);
    if (admin) {
      await admin.addActivityLog({
        action: `report_${action}`,
        target: 'system',
        targetId: report._id,
        details: `Handled report: ${action}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.json({
      success: true,
      message: 'Report handled successfully',
      data: { report }
    });

  } catch (error) {
    console.error('Handle report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle report'
    });
  }
};

// Ban user
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin.adminId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already banned'
      });
    }

    user.isActive = false;
    await user.save();

    // Log admin activity
    const admin = await Admin.findById(adminId);
    if (admin) {
      await admin.addActivityLog({
        action: 'ban_user',
        target: 'user',
        targetId: user._id,
        details: `Banned user: ${user.email} - Reason: ${reason}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.json({
      success: true,
      message: 'User banned successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ban user'
    });
  }
};

// Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.adminId;

    const admin = await Admin.findById(adminId)
      .populate('userId', 'name email phone');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: { admin }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile'
    });
  }
};

// Update admin profile
export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const { name, email, currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(adminId).populate('userId');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const user = admin.userId;
    const updates = {};

    // Update name if provided
    if (name && name.trim() !== '') {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 2 and 50 characters'
        });
      }
      updates.name = name.trim();
    }

    // Update email if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already in use'
        });
      }
      updates.email = email.toLowerCase();
    }

    // Update password if provided
    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Validate new password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    // Update user if there are changes
    if (Object.keys(updates).length > 0) {
      const result = await User.updateOne(
        { _id: user._id },
        { $set: updates }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'No changes were made'
        });
      }

      // Log admin activity
      try {
        await admin.addActivityLog({
          action: 'update_profile',
          target: 'admin',
          targetId: admin._id,
          details: `Updated profile: ${Object.keys(updates).join(', ')}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (logError) {
        console.error('Error logging admin activity:', logError);
        // Don't fail the request if logging fails
      }
    }

    // Fetch updated admin data
    const updatedAdmin = await Admin.findById(adminId)
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { admin: updatedAdmin }
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};