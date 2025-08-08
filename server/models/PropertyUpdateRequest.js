import mongoose from 'mongoose';

const PropertyUpdateRequestSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true,
  },
  proposedUpdates: {
    type: mongoose.Schema.Types.Mixed, // Store the fields that are proposed to be updated
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  approvedAt: {
    type: Date,
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  rejectedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  adminNotes: {
    type: String,
  },
}, { timestamps: true });

const PropertyUpdateRequest = mongoose.model('PropertyUpdateRequest', PropertyUpdateRequestSchema);

export default PropertyUpdateRequest;