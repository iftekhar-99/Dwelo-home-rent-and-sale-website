import express from 'express';
import { authenticateToken, ownerAuth } from '../middleware/authMiddleware.js';
import {
  createPropertyRequest,
  getOwnerRequests,
  getUserRequests,
  getRequestById,
  updateRequestStatus,
  cancelPropertyRequest
} from '../controllers/propertyRequestController.js';

const router = express.Router();

// Create a new property request
router.post('/', authenticateToken, createPropertyRequest);

// Get all property requests for an owner
router.get('/owner', ownerAuth, getOwnerRequests);

// Get all property requests made by a user
router.get('/user', authenticateToken, getUserRequests);

// Get a specific property request by ID
router.get('/:requestId', authenticateToken, getRequestById);

// Update property request status (accept/reject)
router.put('/:requestId/status', ownerAuth, updateRequestStatus);

// Cancel a property request (by requester)
router.put('/:requestId/cancel', authenticateToken, cancelPropertyRequest);

export default router;