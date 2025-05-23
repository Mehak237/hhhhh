const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../utils/multer');

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorize('seller', 'admin'), upload.array('images', 5), createProduct);

router.route('/:id')
  .get(getProduct)
  .put(protect, authorize('seller', 'admin'), updateProduct)
  .delete(protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
