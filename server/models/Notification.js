import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'property_approved',
      'property_rejected',
      'request_received',
      'request_approve',
      'request_reject',
      'property_request',
      'request_cancelled',
      'message_received',
      'system_alert',
      'payment_success',
      'payment_failed'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: Date,
  readAt: Date
}, {
  timestamps: true
});

// Indexes for optimal query performance
notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to archive notification
notificationSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

// Static method to find unread notifications for a user
notificationSchema.statics.findUnread = function(userId) {
  return this.find({
    userId,
    isRead: false,
    isArchived: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to find notifications by type
notificationSchema.statics.findByType = function(userId, type) {
  return this.find({
    userId,
    type,
    isArchived: false
  }).sort({ createdAt: -1 });
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return this.create(data);
};

// Static method to create multiple notifications
notificationSchema.statics.createMultiple = function(notifications) {
  return this.insertMany(notifications);
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;