import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  getUserChats,
  getChatById,
  startChat,
  sendMessage,
  markChatAsRead,
  getUnreadCount
} from '../controllers/chatController.js';

const router = express.Router();

// Get all chats for a user
router.get('/', authenticateToken, getUserChats);

// Get unread message count
router.get('/unread', authenticateToken, getUnreadCount);

// Get a specific chat by ID
router.get('/:chatId', authenticateToken, getChatById);

// Start a new chat or get existing chat
router.post('/start', authenticateToken, startChat);

// Send a message in a chat
router.post('/message', authenticateToken, sendMessage);

// Mark chat as read
router.put('/:chatId/read', authenticateToken, markChatAsRead);

export default router;