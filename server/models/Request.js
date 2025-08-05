import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  type: {
    type: String,
    enum: ['viewing', 'purchase', 'rental', 'inquiry'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  ownerResponse: {
    action: {
      type: String,
      enum: ['approve', 'reject']
    },
    message: String,
    timestamp: Date
  },
  scheduledDate: Date,
  scheduledTime: String,
  contactPreference: {
    type: String,
    enum: ['email', 'phone', 'both'],
    default: 'email'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for optimal query performance
requestSchema.index({ buyerId: 1 });
requestSchema.index({ ownerId: 1 });
requestSchema.index({ propertyId: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ isRead: 1 });

// Virtual for request age
requestSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to mark as read
requestSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Method to archive request
requestSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

// Static method to find pending requests for an owner
requestSchema.statics.findPendingForOwner = function(ownerId) {
  return this.find({
    ownerId,
    status: 'pending',
    isArchived: false
  }).populate('buyerId', 'name email phone')
    .populate('propertyId', 'title address');
};

// Static method to find requests by status
requestSchema.statics.findByStatus = function(status, ownerId = null) {
  const query = { status, isArchived: false };
  if (ownerId) query.ownerId = ownerId;
  
  return this.find(query)
    .populate('buyerId', 'name email phone')
    .populate('propertyId', 'title address')
    .sort({ createdAt: -1 });
};

const Request = mongoose.model('Request', requestSchema);

export default Request; 