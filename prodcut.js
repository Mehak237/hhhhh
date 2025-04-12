const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['home-decor', 'jewelry', 'furniture', 'art', 'fashion', 'other']
  },
  materialsUsed: [{
    type: String,
    required: true
  }],
  colors: [String],
  images: [{
    url: String,
    public_id: String
  }],
  sustainabilityInfo: {
    wasteDiverted: String,
    co2Reduction: String
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  ratings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update average rating when reviews are updated
productSchema.methods.updateAverageRating = async function() {
  const reviews = await this.model('Review').find({ product: this._id });
  if (reviews.length === 0) {
    this.averageRating = 0;
    return this.save();
  }
  
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  this.averageRating = sum / reviews.length;
  await this.save();
};

module.exports = mongoose.model('Product', productSchema);
