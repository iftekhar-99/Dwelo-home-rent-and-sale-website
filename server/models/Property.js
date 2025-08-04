import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'condo', 'townhouse', 'villa', 'land', 'commercial'],
    required: true
  },
  listingType: {
    type: String,
    enum: ['sale', 'rent'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  location: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  details: {
    bedrooms: {
      type: Number,
      min: 0
    },
    bathrooms: {
      type: Number,
      min: 0
    },
    area: {
      size: Number,
      unit: {
        type: String,
        enum: ['sqft', 'sqm', 'acres'],
        default: 'sqft'
      }
    },
    yearBuilt: Number,
    parking: {
      type: String,
      enum: ['none', 'street', 'garage', 'covered']
    }
  },
  amenities: [{
    type: String,
    enum: [
      'air_conditioning', 'heating', 'balcony', 'garden', 'pool', 'gym',
      'elevator', 'security', 'furnished', 'pet_friendly', 'utilities_included'
    ]
  }],
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'sold', 'rented', 'inactive'],
    default: 'pending'
  },
  approvalDetails: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    approvedAt: Date,
    rejectionReason: String,
    adminNotes: String
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'fraud', 'inappropriate', 'fake', 'other']
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    resolvedAt: Date,
    adminNotes: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date,
  tags: [String],
  seoData: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Indexes for optimal query performance
propertySchema.index({ ownerId: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ 'location.address.city': 1 });
propertySchema.index({ 'location.address.state': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ isActive: 1 });
propertySchema.index({ isFeatured: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ 'reports.status': 1 });

// Virtual for total reports count
propertySchema.virtual('totalReports').get(function() {
  return this.reports.length;
});

// Virtual for pending reports count
propertySchema.virtual('pendingReportsCount').get(function() {
  return this.reports.filter(report => report.status === 'pending').length;
});

// Virtual for full address
propertySchema.virtual('fullAddress').get(function() {
  const addr = this.location.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Method to increment views
propertySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to add to favorites
propertySchema.methods.addToFavorites = function(userId) {
  if (!this.favorites.some(fav => fav.userId.equals(userId))) {
    this.favorites.push({ userId });
  }
  return this.save();
};

// Method to remove from favorites
propertySchema.methods.removeFromFavorites = function(userId) {
  this.favorites = this.favorites.filter(fav => !fav.userId.equals(userId));
  return this.save();
};

// Method to add report
propertySchema.methods.addReport = function(reportData) {
  this.reports.push(reportData);
  return this.save();
};

// Method to approve property
propertySchema.methods.approve = function(adminId, notes = '') {
  this.status = 'approved';
  this.approvalDetails = {
    approvedBy: adminId,
    approvedAt: new Date(),
    adminNotes: notes
  };
  return this.save();
};

// Method to reject property
propertySchema.methods.reject = function(adminId, reason, notes = '') {
  this.status = 'rejected';
  this.approvalDetails = {
    approvedBy: adminId,
    approvedAt: new Date(),
    rejectionReason: reason,
    adminNotes: notes
  };
  return this.save();
};

// Static method to find pending properties
propertySchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).populate('ownerId');
};

// Static method to find reported properties
propertySchema.statics.findReported = function() {
  return this.find({
    'reports.status': { $in: ['pending', 'investigating'] }
  }).populate('ownerId');
};

const Property = mongoose.model('Property', propertySchema);

export default Property; 