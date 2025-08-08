import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus
} from '../controllers/wishlistController.js';

const router = express.Router();

// Get user's wishlist
router.get('/', authenticateToken, getUserWishlist);

// Add property to wishlist
router.post('/add', authenticateToken, addToWishlist);

// Remove property from wishlist
router.delete('/:propertyId', authenticateToken, removeFromWishlist);

// Check if a property is in user's wishlist
router.get('/check/:propertyId', authenticateToken, checkWishlistStatus);

export default router;