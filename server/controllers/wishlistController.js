import Wishlist from '../models/Wishlist.js';
import Property from '../models/Property.js';
import mongoose from 'mongoose';

// Get user's wishlist
export const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    
    // Find or create wishlist
    const wishlist = await Wishlist.findOrCreateWishlist(userId);
    
    // Populate property details
    await wishlist.populate({
      path: 'properties',
      select: 'title price location type images status details'
    });
    
    res.status(200).json({
      success: true,
      data: { wishlist }
    });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wishlist',
      error: error.message
    });
  }
};

// Add property to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user.id || req.user.userId;
    
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }
    
    // Validate property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Find or create wishlist
    const wishlist = await Wishlist.findOrCreateWishlist(userId);
    
    // Add property to wishlist
    await wishlist.addProperty(propertyId);
    
    res.status(200).json({
      success: true,
      message: 'Property added to wishlist',
      data: { wishlist }
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add property to wishlist',
      error: error.message
    });
  }
};

// Remove property from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id || req.user.userId;
    
    // Find wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    // Remove property from wishlist
    await wishlist.removeProperty(propertyId);
    
    res.status(200).json({
      success: true,
      message: 'Property removed from wishlist',
      data: { wishlist }
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove property from wishlist',
      error: error.message
    });
  }
};

// Check if a property is in user's wishlist
export const checkWishlistStatus = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;
    
    // Find wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: { isInWishlist: false }
      });
    }
    
    // Check if property is in wishlist
    const isInWishlist = wishlist.properties.some(
      property => property.toString() === propertyId
    );
    
    res.status(200).json({
      success: true,
      data: { isInWishlist }
    });
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist status',
      error: error.message
    });
  }
};