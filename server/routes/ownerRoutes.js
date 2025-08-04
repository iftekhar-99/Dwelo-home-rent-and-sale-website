import express from 'express';
import { logOwnerActivity } from '../middleware/activityLogger.js';
import {
  ownerLogin,
  getOwnerDashboard,
  createProperty,
  getOwnerProperties,
  updateProperty,
  deleteProperty,
  getOwnerProfile,
  updateOwnerProfile,
  uploadPropertyImages,
  getPropertyRequests,
  handlePropertyRequest
} from '../controllers/ownerController.js';
import { ownerAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', ownerLogin);

// Protected routes - add activity logger to all owner routes
router.use(ownerAuth);
router.use(logOwnerActivity);

router.get('/dashboard', getOwnerDashboard);
router.get('/properties', getOwnerProperties);
router.post('/properties', createProperty);
router.put('/properties/:propertyId', updateProperty);
router.delete('/properties/:propertyId', deleteProperty);
router.get('/profile', getOwnerProfile);
router.put('/profile', updateOwnerProfile);
router.post('/upload-images', uploadPropertyImages);
router.get('/requests', getPropertyRequests);
router.put('/requests/:requestId', handlePropertyRequest);

export default router;