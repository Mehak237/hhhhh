const Product = require('../models/Product');
const Review = require('../models/Review');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    // Filtering
    const query = {};
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Sorting
    let sort = {};
    if (req.query.sort) {
      const sortParts = req.query.sort.split(':');
      sort[sortParts[0]] = sortParts[1] === 'desc' ? -1 : 1;
    } else {
      sort = { createdAt: -1 };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sort)
      .skip(startIndex)
      .limit(limit)
      .populate('seller', 'name avatar')
      .populate('ratings');

    res.status(200).json({
      success: true,
      count: products.length,
      page,
      pages: Math.ceil(total / limit),
      data: products
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name avatar bio')
      .populate({
        path: 'ratings',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Seller)
exports.createProduct = async (req, res, next) => {
  try {
    // Add seller to req.body
    req.body.seller = req.user.id;

    // Upload images to Cloudinary
    const imageUploads = req.files.map(file => 
      uploadToCloudinary(file.path, 'waste-to-wonder/products')
    );
    const imageResults = await Promise.all(imageUploads);
    
    // Format images for database
    req.body.images = imageResults.map(result => ({
      url: result.secure_url,
      public_id: result.public_id
    }));

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller/Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Handle image updates if new files are uploaded
    if (req.files && req.files.length > 0) {
      // Upload new images
      const imageUploads = req.files.map(file => 
        uploadToCloudinary(file.path, 'waste-to-wonder/products')
      );
      const imageResults = await Promise.all(imageUploads);
      
      // Format new images
      const newImages = imageResults.map(result => ({
        url: result.secure_url,
        public_id: result.public_id
      }));

      // Combine with existing images (if not replacing all)
      req.body.images = [...product.images, ...newImages];
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller/Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // TODO: Delete images from Cloudinary
    // await deleteFromCloudinary(product.images.map(img => img.public_id));

    await product.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
