import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
} from '../controllers/authController.js';
import {
  authenticateToken,
  authLogging
} from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const router = express.Router();

// Get directory name for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, PDF and DOC files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per request
  },
  fileFilter: fileFilter
});

// Public routes (no authentication required)
router.post('/register', 
  authLogging('register'),
  upload.single('verificationDocs'),
  asyncHandler(register)
);

router.post('/login',
  authLogging('login'),
  asyncHandler(login)
);

// Protected routes (authentication required)
router.get('/profile',
  authenticateToken,
  authLogging('get_profile'),
  asyncHandler(getProfile)
);

router.put('/profile',
  authenticateToken,
  authLogging('update_profile'),
  asyncHandler(updateProfile)
);

router.put('/change-password',
  authenticateToken,
  authLogging('change_password'),
  asyncHandler(changePassword)
);

router.post('/logout',
  authenticateToken,
  authLogging('logout'),
  asyncHandler(logout)
);

// Health check route for auth service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;