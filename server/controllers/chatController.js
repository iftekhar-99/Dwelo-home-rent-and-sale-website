import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

// Get all chats for a user
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const chats = await Chat.findChatsForUser(userId);
    
    res.status(200).json({
      success: true,
      data: { chats }
    });
  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats',
      error: error.message
    });
  }
};

// Get a specific chat by ID
export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id || req.user.userId;
    
    const chat = await Chat.findById(chatId)
      .populate('participants', 'name email')
      .populate('propertyId', 'title images');
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    // Check if user is a participant
    if (!chat.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this chat'
      });
    }
    
    // Mark messages as read for this user
    await chat.markAsRead(userId);
    
    res.status(200).json({
      success: true,
      data: { chat }
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat',
      error: error.message
    });
  }
};

// Start a new chat or get existing chat
export const startChat = async (req, res) => {
  try {
    const { recipientId, propertyId } = req.body;
    const userId = req.user.id || req.user.userId;
    
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required'
      });
    }
    
    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }
    
    // Find or create chat
    const chat = await Chat.findOrCreateChat([userId, recipientId], propertyId);
    
    res.status(200).json({
      success: true,
      data: { chat }
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start chat',
      error: error.message
    });
  }
};

// Send a message in a chat
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const userId = req.user.id || req.user.userId;
    
    if (!chatId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID and message content are required'
      });
    }
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    // Check if user is a participant
    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this chat'
      });
    }
    
    // Add message to chat
    await chat.addMessage(userId, content);
    
    // Send notification to other participants
    const sender = await User.findById(userId);
    const otherParticipants = chat.participants.filter(p => p.toString() !== userId.toString());
    
    // Create notifications for other participants
    const notifications = otherParticipants.map(participantId => ({
      userId: participantId,
      type: 'message_received',
      title: 'New Message',
      message: `${sender.name} sent you a message`,
      data: {
        chatId: chat._id,
        senderId: userId,
        senderName: sender.name,
        messagePreview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      }
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    res.status(200).json({
      success: true,
      data: {
        message: {
          sender: userId,
          content,
          timestamp: new Date(),
          isRead: false
        }
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Mark all messages in a chat as read
export const markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id || req.user.userId;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    // Check if user is a participant
    if (!chat.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this chat'
      });
    }
    
    await chat.markAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: 'Chat marked as read'
    });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark chat as read',
      error: error.message
    });
  }
};

// Get unread message count for a user
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const chats = await Chat.find({ participants: userId });
    
    let totalUnread = 0;
    chats.forEach(chat => {
      const unreadForUser = chat.unreadCount.get(userId.toString()) || 0;
      totalUnread += unreadForUser;
    });
    
    res.status(200).json({
      success: true,
      data: { unreadCount: totalUnread }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};