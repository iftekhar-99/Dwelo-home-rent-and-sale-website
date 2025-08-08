import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  properties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
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
wishlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index for faster queries
wishlistSchema.index({ user: 1 });

// Method to add a property to wishlist
wishlistSchema.methods.addProperty = function(propertyId) {
  // Check if property already exists in wishlist
  if (!this.properties.includes(propertyId)) {
    this.properties.push(propertyId);
  }
  return this.save();
};

// Method to remove a property from wishlist
wishlistSchema.methods.removeProperty = function(propertyId) {
  this.properties = this.properties.filter(
    property => property.toString() !== propertyId.toString()
  );
  return this.save();
};

// Static method to find or create a wishlist for a user
wishlistSchema.statics.findOrCreateWishlist = async function(userId) {
  let wishlist = await this.findOne({ user: userId });
  
  if (!wishlist) {
    wishlist = new this({
      user: userId,
      properties: []
    });
    await wishlist.save();
  }
  
  return wishlist;
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;