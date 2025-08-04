import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'property_created',
      'property_updated',
      'property_deleted',
      'request_approved',
      'request_rejected',
      'profile_updated',
      'other'
    ]
  },
  details: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
activitySchema.index({ ownerId: 1, timestamp: -1 });

export default mongoose.model('Activity', activitySchema);