import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Buyer from '../models/Buyer.js';
import Renter from '../models/Renter.js';
import Owner from '../models/Owner.js';
import Admin from '../models/Admin.js';

// JWT token generation
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Registration controller
export const register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { name, email, password, role, phone } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, and role'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      });
    }

    // Validate role
    const validRoles = ['buyer', 'renter', 'owner', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selection. Must be one of: buyer, renter, owner, admin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email or try logging in.'
      });
    }

    // Handle file verification for owners
    let verificationDoc = null;
    if (role === 'owner') {
      if (req.file) {
        verificationDoc = req.file.path;
      }
      // For testing purposes, verification documents are optional
      // In production, you would require them
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      phone: phone || undefined
    });

    await user.save();

    // Create role-specific document based on role
    let roleSpecificDoc = null;
    
    switch (role) {
      case 'buyer':
        roleSpecificDoc = new Buyer({
          userId: user._id
        });
        break;
        
      case 'renter':
        roleSpecificDoc = new Renter({
          userId: user._id
        });
        break;
        
      case 'owner':
        const ownerData = {
          userId: user._id
        };
        
        if (verificationDoc && req.file) {
          ownerData.verificationDocuments = [{
            documentType: 'id_proof',
            fileName: req.file.originalname,
            filePath: verificationDoc
          }];
        }
        
        roleSpecificDoc = new Owner(ownerData);
        break;
        
      case 'admin':
        // Admin creation should be restricted - only super admins can create admins
        roleSpecificDoc = new Admin({
          userId: user._id,
          adminLevel: 'admin'
        });
        break;
    }

    if (roleSpecificDoc) {
      await roleSpecificDoc.save();
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email.'
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check password using simple bcrypt comparison
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login using updateOne to avoid document conflicts
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Get role-specific data safely
    let roleData = null;
    try {
      switch (user.role) {
        case 'buyer':
          roleData = await Buyer.findOne({ userId: user._id });
          break;
        case 'renter':
          roleData = await Renter.findOne({ userId: user._id });
          break;
        case 'owner':
          roleData = await Owner.findOne({ userId: user._id });
          break;
        case 'admin':
          roleData = await Admin.findOne({ userId: user._id });
          break;
      }
    } catch (roleError) {
      console.log('Role data retrieval failed, continuing without it:', roleError.message);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLogin: new Date()
        },
        roleData,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.includes('Account is temporarily locked')) {
      return res.status(423).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get role-specific data
    let roleData = null;
    switch (user.role) {
      case 'buyer':
        roleData = await Buyer.findOne({ userId: user._id });
        break;
      case 'renter':
        roleData = await Renter.findOne({ userId: user._id });
        break;
      case 'owner':
        roleData = await Owner.findOne({ userId: user._id });
        break;
      case 'admin':
        roleData = await Admin.findOne({ userId: user._id });
        break;
    }

    res.json({
      success: true,
      data: {
        user,
        roleData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password using simple bcrypt comparison
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
        message: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// Logout (client-side token removal)
export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement a blacklist here if needed
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};