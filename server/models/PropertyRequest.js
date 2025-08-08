import mongoose from 'mongoose';

const propertyRequestSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  requestType: {
    type: String,
    enum: ['buy', 'rent'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  offerAmount: {
    type: Number,
    required: false
  },
  preferredMoveInDate: {
    type: Date,
    required: false
  },
  responseMessage: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp on save
propertyRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for faster queries
propertyRequestSchema.index({ property: 1 });
propertyRequestSchema.index({ requester: 1 });
propertyRequestSchema.index({ owner: 1 });
propertyRequestSchema.index({ status: 1 });

// Method to update request status
propertyRequestSchema.methods.updateStatus = function(status, responseMessage = '') {
  this.status = status;
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
  return this.save();
};

// Static method to find requests for a property
propertyRequestSchema.statics.findRequestsForProperty = function(propertyId) {
  return this.find({ property: propertyId })
    .sort({ createdAt: -1 })
    .populate('requester', 'name email phone')
    .populate('property', 'title price location type');
};

// Static method to find requests by owner
propertyRequestSchema.statics.findRequestsByOwner = function(ownerId) {
  return this.find({ owner: ownerId })
    .sort({ createdAt: -1 })
    .populate('requester', 'name email phone')
    .populate('property', 'title price location type images');
};

// Static method to find requests by requester
propertyRequestSchema.statics.findRequestsByRequester = function(requesterId) {
  return this.find({ requester: requesterId })
    .sort({ createdAt: -1 })
    .populate('owner', 'name email')
    .populate('property', 'title price location type images');
};

const PropertyRequest = mongoose.model('PropertyRequest', propertyRequestSchema);

export default PropertyRequest;