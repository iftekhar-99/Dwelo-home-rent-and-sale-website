import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [messageSchema],
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: false
  },
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Indexes for optimal query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ propertyId: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

// Method to add a new message
chatSchema.methods.addMessage = async function(senderId, content) {
  const message = {
    sender: senderId,
    content,
    timestamp: new Date(),
    isRead: false
  };

  this.messages.push(message);
  this.lastMessage = {
    content,
    sender: senderId,
    timestamp: message.timestamp
  };

  // Update unread count for all participants except sender
  this.participants.forEach(participantId => {
    if (!participantId.equals(senderId)) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });

  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = async function(userId) {
  const userIdStr = userId.toString();
  
  // Mark all messages as read for this user
  this.messages.forEach(message => {
    if (!message.sender.equals(userId) && !message.isRead) {
      message.isRead = true;
    }
  });

  // Reset unread count for this user
  this.unreadCount.set(userIdStr, 0);
  
  return this.save();
};

// Static method to find chats for a user
chatSchema.statics.findChatsForUser = function(userId) {
  return this.find({ participants: userId })
    .sort({ 'lastMessage.timestamp': -1 })
    .populate('participants', 'name email')
    .populate('propertyId', 'title images');
};

// Static method to find or create a chat between users
chatSchema.statics.findOrCreateChat = async function(participantIds, propertyId = null) {
  // Sort participant IDs to ensure consistent query
  const sortedParticipants = [...participantIds].sort();
  
  // Try to find existing chat with these participants
  let chat = await this.findOne({
    participants: { $all: sortedParticipants, $size: sortedParticipants.length },
    propertyId: propertyId
  });
  
  // If no chat exists, create a new one
  if (!chat) {
    chat = new this({
      participants: sortedParticipants,
      propertyId: propertyId,
      messages: [],
      unreadCount: new Map()
    });
    await chat.save();
  }
  
  return chat;
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;