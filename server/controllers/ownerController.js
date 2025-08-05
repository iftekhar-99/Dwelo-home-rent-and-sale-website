import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Owner from '../models/Owner.js';
import Property from '../models/Property.js';
import Request from '../models/Request.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

// JWT token generation for owner
const generateOwnerToken = (ownerId, userId) => {
  return jwt.sign(
    { ownerId, userId, type: 'owner' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Owner login
export const ownerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.role !== 'owner') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const owner = await Owner.findOne({ userId: user._id });
    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Owner profile not found'
      });
    }

    await User.updateOne(
      { _id: user._id },
      { lastLogin: new Date() }
    );

    const token = generateOwnerToken(owner._id, user._id);

    res.json({
      success: true,
      message: 'Owner login successful',
      data: {
        owner: {
          id: owner._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          verificationStatus: owner.verificationStatus,
          businessDetails: owner.businessDetails,
          profilePhoto: owner.profilePhoto
        },
        token
      }
    });

  } catch (error) {
    console.error('Owner login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Get owner dashboard metrics
export const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;

    // Enhanced metrics calculation
    const [
      properties,
      pendingProperties,
      totalProperties,
      recentRequests,
      propertyStats,
      recentActivity
    ] = await Promise.all([
      // Recent properties
      Property.find({ ownerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status views favorites createdAt images address bedrooms bathrooms price'),

      // Pending approvals
      Property.countDocuments({
        ownerId,
        status: 'pending_admin_approval'
      }),

      // Total properties
      Property.countDocuments({ ownerId }),

      // Recent requests
      Request.find({ ownerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('buyerId', 'name email')
        .select('type status createdAt'),

      // Property statistics
      Property.aggregate([
        { $match: { ownerId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalViews: { $sum: '$views' },
            totalFavorites: { $sum: '$favorites' }
          }
        }
      ]),

      // Recent activity
      Activity.find({ ownerId })
        .sort({ timestamp: -1 })
        .limit(10)
        .select('type details timestamp')
    ]);

    // Process statistics
    const statusBreakdown = propertyStats.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        views: item.totalViews,
        favorites: item.totalFavorites
      };
      return acc;
    }, {});

    const dashboard = {
      overview: {
        totalProperties,
        pendingApprovals: pendingProperties,
        totalRequests: recentRequests.length,
        recentActivity: recentActivity.map(activity => ({
          id: activity._id,
          type: activity.type,
          details: activity.details,
          timestamp: activity.timestamp
        }))
      },
      properties: {
        recent: properties.map(p => ({
          id: p._id,
          title: p.title,
          status: p.status,
          address: p.address,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          price: p.price,
          images: p.images,
          metrics: {
            views: p.views,
            favorites: p.favorites
          },
          createdAt: p.createdAt
        })),
        stats: statusBreakdown
      },
      requests: {
        recent: recentRequests.map(r => ({
          id: r._id,
          type: r.type,
          status: r.status,
          buyer: {
            name: r.buyerId.name,
            email: r.buyerId.email
          },
          createdAt: r.createdAt
        }))
      }
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Get owner dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

// Create new property
export const createProperty = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    const {
      title,
      description,
      propertyType,
      listingType,
      price,
      address,
      city,
      state,
      zipCode,
      country = 'United States',
      bedrooms,
      bathrooms,
      squareFootage,
      amenities,
      images
    } = req.body;

    if (!title || !description || !propertyType || !listingType || !price || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price'
      });
    }

    if (!images || images.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'One image required'
      });
    }

    // Parse amenities if it's a string
    let parsedAmenities = [];
    if (amenities) {
      if (typeof amenities === 'string') {
        try {
          parsedAmenities = JSON.parse(amenities);
        } catch (error) {
          console.error('Error parsing amenities:', error);
          parsedAmenities = [];
        }
      } else if (Array.isArray(amenities)) {
        parsedAmenities = amenities;
      }
    }

    const property = new Property({
      ownerId,
      title,
      description,
      propertyType,
      listingType,
      price,
      location: {
        address: {
          street: address,
          city,
          state,
          zipCode,
          country
        }
      },
      details: {
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        area: {
          size: squareFootage || 0,
          unit: 'sqft'
        }
      },
      amenities: parsedAmenities,
      images: images.map(img => ({
        url: img,
        isPrimary: true
      })),
      status: 'pending'
    });

    await property.save();

    res.status(201).json({
      success: true,
      message: 'Property created successfully and submitted for approval',
      data: { property }
    });

  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property'
    });
  }
};

// Get owner's properties
export const getOwnerProperties = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    const query = { ownerId };
    if (status) query.status = status;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const properties = await Property.find(query)
      .sort(sortOptions)
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

  } catch (error) {
    console.error('Get owner properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    });
  }
};

// Get owner's specific property
export const getOwnerProperty = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    const { propertyId } = req.params;

    const property = await Property.findOne({ _id: propertyId, ownerId })
      .populate('ownerId', 'name email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: { property }
    });

  } catch (error) {
    console.error('Get owner property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property'
    });
  }
};

// Update property
export const updateProperty = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    const { propertyId } = req.params;
    const updateData = req.body;

    const property = await Property.findOne({ _id: propertyId, ownerId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update approved property'
      });
    }

    if (updateData.price || updateData.description || updateData.images) {
      updateData.status = 'pending';
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: { property: updatedProperty }
    });

  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property'
    });
  }
};

// Delete property
export const deleteProperty = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    const { propertyId } = req.params;

    const property = await Property.findOne({ _id: propertyId, ownerId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await Property.findByIdAndDelete(propertyId);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property'
    });
  }
};

// Get owner profile
export const getOwnerProfile = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;

    const owner = await Owner.findById(ownerId)
      .populate('userId', 'name email phone');

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    res.json({
      success: true,
      data: { owner }
    });

  } catch (error) {
    console.error('Get owner profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update owner profile
export const updateOwnerProfile = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    const { name, phone, businessDetails, profilePhoto } = req.body;

    const owner = await Owner.findById(ownerId).populate('userId');
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    const updates = {};

    if (name) {
      await User.updateOne(
        { _id: owner.userId._id },
        { name }
      );
    }

    if (phone) {
      await User.updateOne(
        { _id: owner.userId._id },
        { phone }
      );
    }

    if (businessDetails) {
      updates.businessDetails = businessDetails;
    }

    if (profilePhoto) {
      updates.profilePhoto = profilePhoto;
    }

    if (Object.keys(updates).length > 0) {
      await Owner.findByIdAndUpdate(ownerId, updates);
    }

    const updatedOwner = await Owner.findById(ownerId)
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { owner: updatedOwner }
    });

  } catch (error) {
    console.error('Update owner profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Upload property images
export const uploadPropertyImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const imageUrls = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename
    }));

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: { images: imageUrls }
    });

  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
};

// Get property requests
export const getPropertyRequests = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    const { status, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
    
    const query = { ownerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [requests, total] = await Promise.all([
      Request.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('buyerId', 'name email phone')
        .populate('propertyId', 'title address'),
      Request.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        requests: requests.map(r => ({
          id: r._id,
          type: r.type,
          status: r.status,
          property: {
            id: r.propertyId._id,
            title: r.propertyId.title,
            address: r.propertyId.address
          },
          buyer: {
            name: r.buyerId.name,
            email: r.buyerId.email,
            phone: r.buyerId.phone
          },
          message: r.message,
          attachments: r.attachments,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        })),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: skip + requests.length < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get property requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property requests'
    });
  }
};

// Handle property request
export const handlePropertyRequest = async (req, res) => {
  try {
    const ownerId = req.owner.ownerId;
    const { requestId } = req.params;
    const { action, message } = req.body;

    const request = await Request.findOne({ 
      _id: requestId,
      ownerId
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.ownerResponse = {
      action,
      message,
      timestamp: new Date()
    };

    await request.save();

    // Create notification for buyer
    await Notification.create({
      userId: request.buyerId,
      type: 'request_' + action,
      title: `Property Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      message: message || `Your request has been ${action}d`,
      data: {
        requestId: request._id,
        propertyId: request.propertyId
      }
    });

    res.json({
      success: true,
      message: `Request ${action}d successfully`,
      data: { request }
    });

  } catch (error) {
    console.error('Handle property request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle request'
    });
  }
};
