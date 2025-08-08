import express from 'express';
import { ownerAuth } from '../middleware/authMiddleware.js';
import propertyUploadMiddleware from '../middleware/propertyUploadMiddleware.js';
import { 
    createProperty,
    getAllProperties,
    getPropertyById,
    updateProperty,
    deleteProperty
} from '../controllers/propertyController.js';

const router = express.Router();

// Public routes
router.get('/', getAllProperties);
router.get('/:id', getPropertyById);

// Protected routes - require owner authentication
router.use(ownerAuth);

// Apply upload middleware to create property route
router.post('/', propertyUploadMiddleware, createProperty);
// Do not require image upload for updates; allow metadata-only updates
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export default router;