const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add review
// @route   POST /api/products/:productId/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    // Check if product exists
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: req.params.productId
    });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Already reviewed this product' });
    }

    // Create review
    const review = await Review.create({
      product: req.params.productId,
      user: req.user.id,
      rating: req.body.rating,
      review: req.body.review
    });

    // Update product's average rating
    await product.updateAverageRating();

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update product's average rating
    const product = await Product.findById(review.product);
    await product.updateAverageRating();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const productId = review.product;
    await review.remove();

    // Update product's average rating
    const product = await Product.findById(productId);
    await product.updateAverageRating();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
