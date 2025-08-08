import Request from '../models/Request.js';
import User from '../models/User.js';
import Owner from '../models/Owner.js';
import Property from '../models/Property.js';
import mongoose from 'mongoose';

// Create a new request (contact owner)
export const createRequest = async (req, res) => {
  try {
    const { propertyId, ownerId, message } = req.body;
    const buyerId = req.user.id || req.user.userId; // From auth middleware

    // Validate required fields
    if (!propertyId || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property ID and message are required' 
      });
    }

    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }

    // Get the owner ID from the request body or from the property
    // Convert possible Owner document to the underlying User id for messaging
    let propertyOwnerId = ownerId;
    if (!propertyOwnerId) {
      if (property.ownerUserId) {
        propertyOwnerId = property.ownerUserId;
      } else if (property.ownerId) {
        const ownerDoc = await Owner.findById(property.ownerId);
        propertyOwnerId = ownerDoc?.userId;
      }
    }
    
    if (!propertyOwnerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Owner information is required' 
      });
    }

    // Create the request
    const newRequest = new Request({
      buyerId,
      ownerId: propertyOwnerId,
      propertyId,
      type: 'inquiry', // Default type for contact owner
      message,
      contactPreference: 'email', // Default contact preference
    });

    await newRequest.save();

    // Get owner contact information
    const owner = await Owner.findById(propertyOwnerId) || await Owner.findOne({ userId: propertyOwnerId });
    if (!owner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Owner not found' 
      });
    }

    // Get owner's user information for contact details
    const ownerUser = await User.findById(owner.userId);
    if (!ownerUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Owner user information not found' 
      });
    }

    // Return success with owner contact information
    res.status(201).json({
      success: true,
      message: 'Your message has been sent to the owner',
      request: {
        id: newRequest._id,
        type: newRequest.type,
        status: newRequest.status,
        createdAt: newRequest.createdAt
      },
      ownerContact: {
        email: ownerUser.email,
        phone: ownerUser.phone || 'Not provided'
      }
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all requests for a buyer
export const getBuyerRequests = async (req, res) => {
  try {
    const buyerId = req.user.id || req.user.userId; // From auth middleware
    
    const requests = await Request.find({ buyerId })
      .populate('propertyId', 'title address images price currency')
      .populate({
        path: 'ownerId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error getting buyer requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get owner contact information for a property
export const getOwnerContact = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: 'Property not found' 
      });
    }

    // Get the owner ID from the property
    const propertyOwnerId = property.ownerId || property.owner;
    if (!propertyOwnerId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Owner information not available for this property' 
      });
    }

    // Find the owner
    const owner = await Owner.findById(propertyOwnerId);
    if (!owner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Owner not found' 
      });
    }

    // Get owner's user information
    const ownerUser = await User.findById(owner.userId);
    if (!ownerUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Owner user information not found' 
      });
    }

    // Return owner contact information
    res.status(200).json({
      success: true,
      ownerContact: {
        email: ownerUser.email,
        phone: ownerUser.phone || 'Not provided'
      }
    });
  } catch (error) {
    console.error('Error getting owner contact:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};