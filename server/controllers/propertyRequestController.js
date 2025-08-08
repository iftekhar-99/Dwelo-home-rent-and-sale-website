import PropertyRequest from '../models/PropertyRequest.js';
import Property from '../models/Property.js';
import Owner from '../models/Owner.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

// Create a new property request
export const createPropertyRequest = async (req, res) => {
  try {
    const { propertyId, ownerId, requestType, message, offerAmount, preferredMoveInDate } = req.body;
    const requesterId = req.user.id || req.user.userId;
    
    if (!propertyId || !requestType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Property ID, request type, and message are required'
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
    
    // Determine the owner's USER id
    let propertyOwnerId = ownerId;
    if (!propertyOwnerId) {
      // property.ownerId is an Owner document id. Resolve to the underlying User id
      const ownerDoc = await Owner.findById(property.ownerId);
      propertyOwnerId = ownerDoc?.userId;
    }
    
    // Validate owner exists
    if (!propertyOwnerId) {
      return res.status(400).json({
        success: false,
        message: 'Owner information is required'
      });
    }

    // Create property request
    const propertyRequest = new PropertyRequest({
      property: propertyId,
      requester: requesterId,
      owner: propertyOwnerId,
      requestType,
      message,
      offerAmount,
      preferredMoveInDate
    });
    
    await propertyRequest.save();
    
    // Send notification to owner
    const requester = await User.findById(requesterId);
    const notification = new Notification({
      userId: propertyOwnerId,
      type: 'property_request',
      title: 'New Property Request',
      message: `${requester.name} has sent a request to ${requestType === 'buy' ? 'buy' : 'rent'} your property: ${property.title}`,
      data: {
        requestId: propertyRequest._id,
        propertyId,
        propertyTitle: property.title,
        requestType,
        requesterId,
        requesterName: requester.name
      }
    });
    
    await notification.save();
    
    res.status(201).json({
      success: true,
      message: 'Property request created successfully',
      data: { propertyRequest }
    });
  } catch (error) {
    console.error('Error creating property request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property request',
      error: error.message
    });
  }
};

// Get all property requests for an owner
export const getOwnerRequests = async (req, res) => {
  try {
    const ownerId = req.user.id || req.user.userId;
    
    const requests = await PropertyRequest.findRequestsByOwner(ownerId);
    
    res.status(200).json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    console.error('Error getting owner requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get property requests',
      error: error.message
    });
  }
};

// Get all property requests made by a user
export const getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    
    const requests = await PropertyRequest.findRequestsByRequester(userId);
    
    res.status(200).json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    console.error('Error getting user requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get property requests',
      error: error.message
    });
  }
};

// Get a specific property request by ID
export const getRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id || req.user.userId;
    
    const request = await PropertyRequest.findById(requestId)
      .populate('requester', 'name email phone')
      .populate('owner', 'name email phone')
      .populate('property', 'title price location type images');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Property request not found'
      });
    }
    
    // Check if user is the owner or requester
    if (request.owner.toString() !== userId && request.requester._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this request'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { request }
    });
  } catch (error) {
    console.error('Error getting property request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get property request',
      error: error.message
    });
  }
};

// Update property request status (accept/reject)
export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;
    const userId = req.user.id;
    
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (accepted/rejected) is required'
      });
    }
    
    const request = await PropertyRequest.findById(requestId)
      .populate('requester', 'name email')
      .populate('property', 'title');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Property request not found'
      });
    }
    
    // Check if user is the owner
    if (request.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this request'
      });
    }
    
    // Update request status
    await request.updateStatus(status, responseMessage);
    
    // Send notification to requester
    const notification = new Notification({
      userId: request.requester._id,
      type: 'request_update',
      title: `Property Request ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
      message: `Your request to ${request.requestType === 'buy' ? 'buy' : 'rent'} property "${request.property.title}" has been ${status === 'accepted' ? 'accepted' : 'rejected'}`,
      data: {
        requestId: request._id,
        propertyId: request.property._id,
        propertyTitle: request.property.title,
        status,
        responseMessage
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: `Property request ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`,
      data: { request }
    });
  } catch (error) {
    console.error('Error updating property request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property request',
      error: error.message
    });
  }
};

// Cancel a property request (by requester)
export const cancelPropertyRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    
    const request = await PropertyRequest.findById(requestId)
      .populate('property', 'title');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Property request not found'
      });
    }
    
    // Check if user is the requester
    if (request.requester.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this request'
      });
    }
    
    // Check if request is already processed
    if (['accepted', 'rejected', 'cancelled'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request that is already ${request.status}`
      });
    }
    
    // Update request status to cancelled
    await request.updateStatus('cancelled');
    
    // Send notification to owner
    const notification = new Notification({
      userId: request.owner,
      type: 'request_cancelled',
      title: 'Property Request Cancelled',
      message: `A request to ${request.requestType === 'buy' ? 'buy' : 'rent'} your property "${request.property.title}" has been cancelled by the requester`,
      data: {
        requestId: request._id,
        propertyId: request.property._id,
        propertyTitle: request.property.title
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Property request cancelled successfully',
      data: { request }
    });
  } catch (error) {
    console.error('Error cancelling property request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel property request',
      error: error.message
    });
  }
};