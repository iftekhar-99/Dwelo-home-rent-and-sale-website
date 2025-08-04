import mongoose from 'mongoose';

const renterSchema = new mongoose.Schema({
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
      enum: ['parking', 'gym', 'pool', 'garden', 'balcony', 'elevator', 'security', 'furnished']
    }],
    leaseTerm: {
      type: String,
      enum: ['monthly', '3months', '6months', 'yearly', 'flexible']
    }
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
  rentalHistory: [{
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    startDate: Date,
    endDate: Date,
    monthlyRent: Number,
    status: {
      type: String,
      enum: ['active', 'completed', 'terminated'],
      default: 'active'
    }
  }],
  employmentInfo: {
    employer: String,
    position: String,
    monthlyIncome: Number,
    employmentStartDate: Date
  },
  references: [{
    name: String,
    relationship: String,
    phone: String,
    email: String
  }],
  creditScore: {
    type: Number,
    min: 300,
    max: 850
  },
  pets: {
    hasPets: {
      type: Boolean,
      default: false
    },
    petTypes: [{
      type: String,
      enum: ['dog', 'cat', 'bird', 'fish', 'other']
    }],
    petCount: Number
  }
}, { 
  timestamps: true 
});

// Indexes for optimal query performance
renterSchema.index({ userId: 1 });
renterSchema.index({ 'preferences.location.city': 1 });
renterSchema.index({ 'preferences.location.state': 1 });
renterSchema.index({ 'employmentInfo.monthlyIncome': 1 });
renterSchema.index({ creditScore: 1 });

// Virtual for active saved properties count
renterSchema.virtual('savedPropertiesCount').get(function() {
  return this.savedProperties.length;
});

// Virtual for active rental count
renterSchema.virtual('activeRentalsCount').get(function() {
  return this.rentalHistory.filter(rental => rental.status === 'active').length;
});

// Method to add saved property
renterSchema.methods.addSavedProperty = function(propertyId) {
  const exists = this.savedProperties.some(sp => sp.propertyId.equals(propertyId));
  if (!exists) {
    this.savedProperties.push({ propertyId });
  }
  return this.save();
};

// Method to remove saved property
renterSchema.methods.removeSavedProperty = function(propertyId) {
  this.savedProperties = this.savedProperties.filter(
    sp => !sp.propertyId.equals(propertyId)
  );
  return this.save();
};

// Method to add search to history
renterSchema.methods.addSearchHistory = function(query) {
  this.searchHistory.unshift({ query });
  // Keep only last 20 searches
  if (this.searchHistory.length > 20) {
    this.searchHistory = this.searchHistory.slice(0, 20);
  }
  return this.save();
};

// Method to add rental to history
renterSchema.methods.addRentalHistory = function(rentalData) {
  this.rentalHistory.push(rentalData);
  return this.save();
};

// Method to update rental status
renterSchema.methods.updateRentalStatus = function(propertyId, status) {
  const rental = this.rentalHistory.find(r => r.propertyId.equals(propertyId));
  if (rental) {
    rental.status = status;
    if (status === 'completed' || status === 'terminated') {
      rental.endDate = new Date();
    }
  }
  return this.save();
};

const Renter = mongoose.model('Renter', renterSchema);

export default Renter; 