import express from 'express';
import { createRequest, getBuyerRequests, getOwnerContact } from '../controllers/requestController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes that require authentication
router.use(authenticateToken);

// Create a new request (contact owner)
router.post('/', createRequest);

// Get all requests for a buyer
router.get('/buyer', getBuyerRequests);

// Get owner contact information for a property
router.get('/owner-contact/:propertyId', getOwnerContact);

export default router;