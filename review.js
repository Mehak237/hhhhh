const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update product's average rating when a review is saved
reviewSchema.post('save', async function(doc) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(doc.product);
  await product.updateAverageRating();
});

// Update product's average rating when a review is removed
reviewSchema.post('remove', async function(doc) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(doc.product);
  await product.updateAverageRating();
});

module.exports = mongoose.model('Review', reviewSchema);
