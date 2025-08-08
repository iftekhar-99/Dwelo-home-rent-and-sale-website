import express from 'express';
import propertyUploadMiddleware from '../middleware/propertyUploadMiddleware.js';
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
  handlePropertyRequest,
  getOwnerProperty,
  requestPropertyUpdateApproval
} from '../controllers/ownerController.js';
import { ownerAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', ownerLogin);

// Protected routes
router.use(ownerAuth);

router.get('/dashboard', getOwnerDashboard);
router.get('/properties/:propertyId', getOwnerProperty);
router.get('/properties', getOwnerProperties);
router.post('/properties', createProperty);
router.put('/properties/:propertyId', updateProperty);
router.post('/properties/:propertyId/request-update', requestPropertyUpdateApproval);
router.delete('/properties/:propertyId', deleteProperty);
router.get('/profile', getOwnerProfile);
router.put('/profile', updateOwnerProfile);
router.post('/upload-images', propertyUploadMiddleware, uploadPropertyImages);
router.get('/requests', getPropertyRequests);
router.put('/requests/:requestId', handlePropertyRequest);

export default router;