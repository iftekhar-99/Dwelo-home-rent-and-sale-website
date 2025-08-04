import mongoose from 'mongoose';

const ownerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDocuments: [{
    documentType: {
      type: String,
      enum: ['id_proof', 'address_proof', 'property_deed', 'business_license', 'tax_document'],
      required: true
    },
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  }],
  properties: [{
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  businessInfo: {
    businessName: String,
    businessType: {
      type: String,
      enum: ['individual', 'corporation', 'partnership', 'llc']
    },
    taxId: String,
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  bankInfo: {
    accountHolderName: String,
    accountNumber: String,
    routingNumber: String,
    bankName: String
  },
  paymentHistory: [{
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    amount: Number,
    type: {
      type: String,
      enum: ['rent', 'commission', 'fee', 'refund']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  ratings: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isPremiumOwner: {
    type: Boolean,
    default: false
  },
  premiumExpiry: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Indexes for optimal query performance
ownerSchema.index({ userId: 1 });
ownerSchema.index({ verificationStatus: 1 });
ownerSchema.index({ averageRating: -1 });
ownerSchema.index({ isPremiumOwner: 1 });
ownerSchema.index({ 'businessInfo.businessType': 1 });

// Virtual for properties count
ownerSchema.virtual('propertiesCount').get(function() {
  return this.properties.length;
});

// Virtual for total earnings
ownerSchema.virtual('totalEarnings').get(function() {
  return this.paymentHistory
    .filter(payment => payment.status === 'completed' && payment.type === 'rent')
    .reduce((total, payment) => total + payment.amount, 0);
});

// Method to add property
ownerSchema.methods.addProperty = function(propertyId) {
  const exists = this.properties.some(p => p.propertyId.equals(propertyId));
  if (!exists) {
    this.properties.push({ propertyId });
  }
  return this.save();
};

// Method to remove property
ownerSchema.methods.removeProperty = function(propertyId) {
  this.properties = this.properties.filter(
    p => !p.propertyId.equals(propertyId)
  );
  return this.save();
};

// Method to add verification document
ownerSchema.methods.addVerificationDocument = function(documentData) {
  this.verificationDocuments.push(documentData);
  return this.save();
};

// Method to update verification status
ownerSchema.methods.updateVerificationStatus = function(status, verifiedBy = null) {
  this.verificationStatus = status;
  if (status === 'verified' && verifiedBy) {
    this.verificationDocuments.forEach(doc => {
      if (!doc.verifiedAt) {
        doc.verifiedAt = new Date();
        doc.verifiedBy = verifiedBy;
      }
    });
  }
  return this.save();
};

// Method to add payment
ownerSchema.methods.addPayment = function(paymentData) {
  this.paymentHistory.push(paymentData);
  return this.save();
};

// Method to add rating
ownerSchema.methods.addRating = function(ratingData) {
  this.ratings.push(ratingData);
  
  // Update average rating
  const totalRating = this.ratings.reduce((sum, r) => sum + r.rating, 0);
  this.averageRating = totalRating / this.ratings.length;
  this.totalReviews = this.ratings.length;
  
  return this.save();
};

// Pre-save hook to update average rating
ownerSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = totalRating / this.ratings.length;
    this.totalReviews = this.ratings.length;
  }
  next();
});

const Owner = mongoose.model('Owner', ownerSchema);

export default Owner; 