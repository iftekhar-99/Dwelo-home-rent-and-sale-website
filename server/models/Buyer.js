import mongoose from 'mongoose';

const buyerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferences: {
    budget: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    propertyType: [{
      type: String,
      enum: ['apartment', 'house', 'condo', 'townhouse', 'studio']
    }],
    bedrooms: {
      min: { type: Number, min: 0, max: 10 },
      max: { type: Number, min: 0, max: 10 }
    },
    bathrooms: {
      min: { type: Number, min: 0, max: 10 },
      max: { type: Number, min: 0, max: 10 }
    },
    location: {
      city: String,
      state: String,
      zipCode: String,
      neighborhoods: [String]
    },
    amenities: [{
      type: String,
      enum: ['parking', 'gym', 'pool', 'garden', 'balcony', 'elevator', 'security']
    }]
  },
  savedProperties: [{
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  searchHistory: [{
    query: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isFirstTimeBuyer: {
    type: Boolean,
    default: true
  },
  preApprovalStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'expired'],
    default: 'none'
  },
  preApprovalAmount: {
    type: Number,
    min: 0
  },
  preApprovalExpiry: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Indexes for optimal query performance
buyerSchema.index({ userId: 1 });
buyerSchema.index({ 'preferences.location.city': 1 });
buyerSchema.index({ 'preferences.location.state': 1 });
buyerSchema.index({ preApprovalStatus: 1 });

// Virtual for active saved properties count
buyerSchema.virtual('savedPropertiesCount').get(function() {
  return this.savedProperties.length;
});

// Method to add saved property
buyerSchema.methods.addSavedProperty = function(propertyId) {
  const exists = this.savedProperties.some(sp => sp.propertyId.equals(propertyId));
  if (!exists) {
    this.savedProperties.push({ propertyId });
  }
  return this.save();
};

// Method to remove saved property
buyerSchema.methods.removeSavedProperty = function(propertyId) {
  this.savedProperties = this.savedProperties.filter(
    sp => !sp.propertyId.equals(propertyId)
  );
  return this.save();
};

// Method to add search to history
buyerSchema.methods.addSearchHistory = function(query) {
  this.searchHistory.unshift({ query });
  // Keep only last 20 searches
  if (this.searchHistory.length > 20) {
    this.searchHistory = this.searchHistory.slice(0, 20);
  }
  return this.save();
};

const Buyer = mongoose.model('Buyer', buyerSchema);

export default Buyer; 