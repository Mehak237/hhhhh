const express = require('express');
const {
  getReviews,
  addReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(getReviews)
  .post(protect, addReview);

router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
