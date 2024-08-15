const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const Category = require('../models/Category');
const upload = require('../middlewares/upload');
const cloudinary = require('../config/cloudinaryConfig');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Utility function for uploading files to Cloudinary with retry logic
const uploadFileWithRetry = async (file, retries = 3) => {
  try {
    return await cloudinary.uploader.upload(file.path, { timeout: 60000 });
  } catch (error) {
    if (retries > 0 && error.http_code === 499) {
      console.warn(`Retrying upload for file: ${file.path}. Retries left: ${retries}`);
      return uploadFileWithRetry(file, retries - 1);
    }
    throw error;
  }
};

// Create a new product
router.post('/add', upload.array('images', 10), async (req, res) => {
  console.log('Request Body:', req.body);
  console.log('Files:', req.files);

  try {
    const {
      title,
      description,
      category,
      price,
      discountPercentage,
      stock,
      brand,
      model,
      warrantyInformation,
      shippingInformation,
      returnPolicy,
      condition,
      specifications,
      images: imageUrls // Expecting image URLs in the request body
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !price || !stock || !brand || !model || !condition) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Process specifications
    let specificationsObject = {};
    if (typeof specifications === 'string') {
      try {
        const parsedSpecifications = JSON.parse(specifications);
        specificationsObject = parsedSpecifications.reduce((acc, spec) => {
          acc[spec.key] = spec.value;
          return acc;
        }, {});
      } catch (error) {
        console.error('Invalid specifications format:', error);
        return res.status(400).json({ message: 'Invalid specifications format' });
      }
    } else if (Array.isArray(specifications)) {
      specificationsObject = specifications.reduce((acc, spec) => {
        acc[spec.key] = spec.value;
        return acc;
      }, {});
    } else {
      return res.status(400).json({ message: 'Invalid specifications format' });
    }

    // Handle image URLs or uploads
    let images = [];
    if (imageUrls && Array.isArray(imageUrls)) {
      images = imageUrls;
    } else if (req.files && req.files.length > 0) {
      try {
        const urls = await Promise.all(req.files.map(file => uploadFileWithRetry(file)));
        images = urls.map(result => result.secure_url);
      } catch (error) {
        console.error('Error uploading images:', error);
        return res.status(500).json({ message: 'Error uploading images' });
      }
    } else {
      return res.status(400).json({ message: 'No images provided' });
    }

    // Create and save the product
    const newProduct = new Product({
      title,
      description,
      category,
      price,
      discountPercentage: discountPercentage || 0,
      rating: 0,
      stock,
      brand,
      model,
      warrantyInformation,
      shippingInformation,
      returnPolicy,
      condition,
      specifications: specificationsObject,
      images
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// router.post('/add', upload.array('images', 10), async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       category,
//       price,
//       discountPercentage,
//       stock,
//       brand,
//       model,
//       warrantyInformation,
//       shippingInformation,
//       returnPolicy,
//       condition,
//       specifications
//     } = req.body;

//     // Validate required fields
//     if (!title || !description || !category || !price || !stock || !brand || !model || !condition) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Parse and validate specifications
//     let specificationsObject = {};
//     try {
//       const parsedSpecifications = JSON.parse(specifications);
//       specificationsObject = parsedSpecifications.reduce((acc, spec) => {
//         acc[spec.key] = spec.value;
//         return acc;
//       }, {});
//     } catch (error) {
//       console.error('Invalid specifications format:', error);
//       return res.status(400).json({ message: 'Invalid specifications format' });
//     }

//     // Upload images to Cloudinary
//     const urls = await Promise.all(req.files.map(file => uploadFileWithRetry(file)));
//     const images = urls.map(result => result.secure_url);

//     // Create and save the new product
//     const newProduct = new Product({
//       title,
//       description,
//       category,
//       price,
//       discountPercentage: discountPercentage || 0,
//       rating: 0,
//       numReviews: 0,
//       stock,
//       brand,
//       model,
//       warrantyInformation,
//       shippingInformation,
//       returnPolicy,
//       condition,
//       specifications: specificationsObject,
//       meta: {
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         barcode: uuidv4(),
//         qrCode: uuidv4()
//       },
//       images
//     });

//     await newProduct.save();
//     res.status(201).json(newProduct);
//   } catch (error) {
//     console.error('Error creating product:', error.message);
//     res.status(500).json({ message: 'Error creating product', error: error.message });
//   }
// });
// Upload images endpoint
router.post('/upload-images', upload.array('images', 10), async (req, res) => {
  console.log('Files received:', req.files);

  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }

  try {
    const urls = await Promise.all(files.map(file => uploadFileWithRetry(file)));
    const imageUrls = urls.map(result => result.secure_url);
    res.json({ imageUrls });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Error uploading images' });
  }
});
// Get product details by IDs
router.post('/details', async (req, res) => {
  try {
    const productIds = req.body.productIds;
    if (!Array.isArray(productIds) || !productIds.length) {
      return res.status(400).json({ message: 'Invalid product IDs' });
    }
    const products = await Product.find({ '_id': { $in: productIds } });
    res.json(products);
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    res.status(500).json({ message: 'Error fetching product details', error: error.message });
  }
});

// Get products by category and filter
// router.get('/', async (req, res) => {
//   try {
//     const { category, priceRange, condition } = req.query;
//     let query = {};

//     if (category) {
//       if (mongoose.Types.ObjectId.isValid(category)) {
//         query.category = mongoose.Types.ObjectId(category);
//       } else {
//         return res.status(400).json({ message: 'Invalid category ID' });
//       }
//     }

//     if (priceRange) {
//       const [min, max] = priceRange.split(',').map(Number);
//       if (isNaN(min) || isNaN(max)) {
//         return res.status(400).json({ message: 'Invalid price range format' });
//       }
//       query.price = { $gte: min, $lte: max };
//     }

//     if (condition) {
//       query.condition = condition;
//     }

//     const products = await Product.find(query).populate('category');
//     res.json(products);
//   } catch (error) {
//     console.error('Error fetching products:', error.message);
//     res.status(500).json({ message: 'Error fetching products', error: error.message });
//   }
// });
//get product by category and filte
router.get("/", async (req, res) => {
  console.log(req.query);
  try {
    const { category, priceRange, condition } = req.query;
    // console.log(req.query);
    let query = {};
    
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = new mongoose.Types.ObjectId(category);
      } else {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    if (priceRange) {
      const [min, max] = priceRange.split(",");
      query.price = { $gte: parseInt(min), $lte: parseInt(max) };
    }

    if (condition) {
      query.condition = condition;
    }
    // console.log(query);
    // const products = await Product.find(query);
    const products = await Product.find(query).populate("category");
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get products by category name
router.get('/category/:categoryName', async (req, res) => {
  const { categoryName } = req.params;
  console.log(`Received request for category: ${categoryName}`);
  
  try {
    // Check if the category exists
    const categoryDoc = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } });
    
    if (!categoryDoc) {
      console.log('Category not found');
      return res.status(404).json({ message: 'Category not found' });
    }

    console.log('Category found:', categoryDoc);

    // Fetch products that belong to the category
    const products = await Product.find({ category: categoryDoc._id }).populate('category');

    if (products.length === 0) {
      console.log('No products found for this category');
      return res.status(200).json({ message: 'No products found for this category', products: [] });
    }

    console.log('Products found:', products);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error.message);
    res.status(500).json({ message: 'Error fetching products by category', error: error.message });
  }
});



// Get product by ID
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    const product = await Product.findById(productId)
      .populate('category', 'name')
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'name'
        }
      });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error.message);
    res.status(500).json({ message: 'Error fetching product by ID', error: error.message });
  }
});

// Delete product by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// Create a review for a specific product
router.post('/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const { rating, comment, reviewerName, reviewerEmail } = req.body;

    if (isNaN(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'Invalid rating. Rating must be between 0 and 5' });
    }

    const newReview = new Review({
      productId,
      rating,
      comment,
      reviewerName,
      reviewerEmail
    });

    await newReview.save();

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.reviews.push(newReview._id);
    product.numReviews = product.reviews.length;

    const totalRating = await Review.aggregate([
      { $match: { _id: { $in: product.reviews } } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);

    product.rating = totalRating.length > 0 ? totalRating[0].averageRating : 0;

    await product.save();

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error.message);
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
});

// Search products by keyword
router.get('/search/:key', async (req, res) => {
  try {
    const keyword = req.params.key;
    const regex = new RegExp(keyword, 'i');

    const products = await Product.find({
      $or: [
        { title: regex },
        { description: regex },
        { 'category.name': regex }
      ]
    }).populate('category');

    res.json(products);
  } catch (error) {
    console.error('Error searching for products:', error.message);
    res.status(500).json({ message: 'Error searching for products', error: error.message });
  }
});

// Route to fetch similar products
router.get('/similar', async (req, res) => {
  const { categoryId, excludeId } = req.query;

  if (!categoryId) {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  try {
    const similarProducts = await Product.find({
      category: categoryId,
      _id: { $ne: excludeId } // Exclude the current product
    }).limit(8);

    res.json(similarProducts);
  } catch (error) {
    console.error('Error fetching similar products:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Update a product by ID
router.put('/:id', upload.array('images', 10), async (req, res) => {
  console.log('Files received:', req.files);
  console.log('Request Body:', req.body);
  try {
    const {
      title,
      description,
      category,
      price,
      discountPercentage,
      stock,
      brand,
      model,
      warrantyInformation,
      shippingInformation,
      returnPolicy,
      condition,
      specifications,
      images: imageUrls,
      isFavorite
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !price || !stock || !brand || !model || !condition) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Process specifications
    let specificationsObject = {};
    if (typeof specifications === 'string') {
      try {
        const parsedSpecifications = JSON.parse(specifications);
        specificationsObject = parsedSpecifications.reduce((acc, spec) => {
          acc[spec.key] = spec.value;
          return acc;
        }, {});
      } catch (error) {
        console.error('Invalid specifications format:', error);
        return res.status(400).json({ message: 'Invalid specifications format' });
      }
    } else if (Array.isArray(specifications)) {
      specificationsObject = specifications.reduce((acc, spec) => {
        acc[spec.key] = spec.value;
        return acc;
      }, {});
    } else {
      return res.status(400).json({ message: 'Invalid specifications format' });
    }

    // Handle image URLs or uploads
    let images = [];
    if (imageUrls && Array.isArray(imageUrls)) {
      images = imageUrls;
    } else if (req.files && req.files.length > 0) {
      try {
        const urls = await Promise.all(req.files.map(file => uploadFileWithRetry(file)));
        images = urls.map(result => result.secure_url);
      } catch (error) {
        console.error('Error uploading images:', error);
        return res.status(500).json({ message: 'Error uploading images' });
      }
    } else {
      return res.status(400).json({ message: 'No images provided' });
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category,
        price,
        discountPercentage: discountPercentage || 0,
        stock,
        brand,
        model,
        warrantyInformation,
        shippingInformation,
        returnPolicy,
        condition,
        specifications: specificationsObject,
        isFavorite: isFavorite || false, 
        images: images.length ? images : undefined, // Update images only if present
        'meta.updatedAt': new Date()
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// Update a product
router.put("/product/:id", async (req, res) => {
  console.log(req.body);
  
  try {
    const { id } = req.params;
    const { title, description, category, price, stock, brand, images } =
      req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        title,
        description,
        category,
        price,
        stock,
        brand,
        images,
      },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating product" });
  }
});


module.exports = router;

// const express = require("express");
// const router = express.Router();
// const Product = require("../models/Product");
// const Review = require("../models/Review");
// const Category = require("../models/Category");
// const upload = require("../middlewares/upload");
// const cloudinary = require("../config/cloudinaryConfig");
// const { v4: uuidv4 } = require("uuid");
// const mongoose = require('mongoose');

// const uploadFileWithRetry = async (file, retries = 3) => {
//   try {
//     return await cloudinary.uploader.upload(file.path, { timeout: 60000 }); // 60 seconds timeout
//   } catch (error) {
//     if (retries > 0 && error.http_code === 499) {
//       console.warn(
//         `Retrying upload for file: ${file.path}. Retries left: ${retries}`
//       );
//       return await uploadFileWithRetry(file, retries - 1);
//     }
//     throw error;
//   }
// };


// // Create a new product
// router.post("/", upload.array("images", 10), async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       category,
//       price,
//       discountPercentage,
//       stock,
//       brand,
//       model,
//       warrantyInformation,
//       shippingInformation,
//       returnPolicy,
//       condition,
//       specifications
//     } = req.body;

//     // Validate required fields
//     if (!title || !description || !category || !price || !stock || !brand || !model || !condition) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Parse specifications if it's a JSON string
//     let parsedSpecifications;
//     try {
//       parsedSpecifications = JSON.parse(specifications);
//     } catch (error) {
//       console.error("Invalid specifications format:", error);
//       return res.status(400).json({ message: 'Invalid specifications format' });
//     }

//     // Transform the parsed specifications array into an object
//     const specificationsObject = parsedSpecifications.reduce((acc, spec) => {
//       acc[spec.key] = spec.value;
//       return acc;
//     }, {});

//     // Upload images to Cloudinary
//     const urls = await Promise.all(
//       req.files.map((file) => uploadFileWithRetry(file))
//     );
//     const images = urls.map((result) => result.secure_url);

//     // Create new product
//     const newProduct = new Product({
//       title,
//       description,
//       category,
//       price,
//       discountPercentage: discountPercentage || 0,
//       rating: 0, // Default initial rating
//       numReviews: 0, // Default initial number of reviews
//       stock,
//       brand,
//       model,
//       warrantyInformation,
//       shippingInformation,
//       returnPolicy,
//       condition,
//       specifications: specificationsObject,
//       meta: {
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         barcode: uuidv4(),
//         qrCode: uuidv4(),
//       },
//       images,
//     });

//     await newProduct.save();

//     res.status(201).json(newProduct);
//   } catch (error) {
//     console.error("Error creating product:", error);
//     res.status(500).json({ message: `Error creating product: ${error.message}` });
//   }
// });

// // Get product details by IDs
// router.post('/details', async (req, res) => {
//   try {
//     const productIds = req.body.productIds;
//     const products = await Product.find({ '_id': { $in: productIds } });
//     res.json(products);
//   } catch (error) {
//     console.error('Error fetching product details:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get products by category and filter
// router.get("/", async (req, res) => {
//   try {
//     const { category, priceRange, condition } = req.query;
//     let query = {};

//     if (category) {
//       if (mongoose.Types.ObjectId.isValid(category)) {
//         query.category = new mongoose.Types.ObjectId(category);
//       } else {
//         return res.status(400).json({ message: "Invalid category ID" });
//       }
//     }

//     if (priceRange) {
//       const [min, max] = priceRange.split(",");
//       query.price = { $gte: parseInt(min), $lte: parseInt(max) };
//     }

//     if (condition) {
//       query.condition = condition;
//     }

//     const products = await Product.find(query).populate("category");
//     res.json(products);
//   } catch (error) {
//     console.error("Error fetching products:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Get product by ID
// router.get('/:productId', async (req, res) => {
//   try {
//     const { productId } = req.params;

//     // Fetch the product by ID and populate category and reviews
//     const product = await Product.findById(productId)
//       .populate('category', 'name') // Populating only the category name
//       .populate({
//         path: 'reviews',
//         populate: {
//           path: 'user',
//           select: 'name'
//         }
//       });

//     if (!product) {
//       console.log(`Product with ID: ${productId} not found`);
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     res.json(product);
//   } catch (error) {
//     console.error('Error fetching product by ID:', error.message);
//     res.status(500).json({ message: 'An error occurred while fetching the product' });
//   }
// });

// // Delete product by ID
// router.delete("/:id", async (req, res) => {
//   try {
//     const deletedProduct = await Product.findByIdAndDelete(req.params.id);
//     if (!deletedProduct) {
//       return res.status(404).json({ message: "Product not found" });
//     }
//     res.json({ message: "Product deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting product:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Create a review for a specific product
// router.post("/:productId/reviews", async (req, res) => {
//   try {
//     const productId = req.params.productId;

//     // Validate productId
//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       return res.status(400).json({ message: "Invalid productId" });
//     }

//     const { rating, comment, reviewerName, reviewerEmail } = req.body;

//     // Validate rating
//     if (isNaN(rating) || rating < 0 || rating > 5) {
//       return res.status(400).json({
//         message: "Invalid rating. Rating must be a number between 0 and 5",
//       });
//     }

//     // Create new review
//     const newReview = await Review.create({
//       productId,
//       rating,
//       comment,
//       reviewerName,
//       reviewerEmail,
//     });

//     // Update product with new review
//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     product.reviews.push(newReview._id);
//     product.numReviews = product.reviews.length;

//     let totalRating = 0;
//     for (const reviewId of product.reviews) {
//       const review = await Review.findById(reviewId);
//       totalRating += review.rating;
//     }
//     const newAverageRating = totalRating / product.numReviews;
//     product.rating = newAverageRating;

//     await product.save();

//     res.status(201).json(newReview);
//   } catch (error) {
//     console.error("Error creating review:", error);
//     res.status(400).json({ message: error.message });
//   }
// });

// // Search products by keyword
// router.get("/search/:key", async (req, res) => {
//   try {
//     const keyword = req.params.key;

//     let data = await Product.find({
//       $or: [
//         { name: { $regex: keyword, $options: 'i' } },
//         { description: { $regex: keyword, $options: 'i' } }
//       ]
//     }).populate('category');

//     if (data.length === 0) {
//       const productsByCategory = await Product.find().populate('category');
//       data = productsByCategory.filter(product =>
//         product.category && product.category.name.toLowerCase().includes(keyword.toLowerCase())
//       );
//     }

//     res.send(data);
//   } catch (error) {
//     console.error('Error searching for products:', error.message);
//     res.status(500).json({ message: 'Error searching for products' });
//   }
// });

// // Route to fetch similar products
// router.get('/similar', async (req, res) => {
//   const { categoryId, excludeId } = req.query;

//   if (!categoryId) {
//     return res.status(400).json({ error: 'Category ID is required' });
//   }

//   try {
//     // Fetch similar products excluding the current product
//     const similarProducts = await Product.find({
//       category: categoryId,
//       _id: { $ne: excludeId }, // Exclude the current product
//     }).limit(8);

//     res.json(similarProducts);
//   } catch (error) {
//     console.error('Error fetching similar products:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;



// const express = require("express");
// const router = express.Router();
// const Product = require("../models/Product");
// const Review = require("../models/Review");
// const Category = require("../models/Category");
// const upload = require("../middlewares/upload");
// const cloudinary = require("../config/cloudinaryConfig");
// const { v4: uuidv4 } = require("uuid");
// const mongoose = require('mongoose');

// const uploadFileWithRetry = async (file, retries = 3) => {
//   try {
//     return await cloudinary.uploader.upload(file.path, { timeout: 60000 }); // 60 seconds timeout
//   } catch (error) {
//     if (retries > 0 && error.http_code === 499) {
//       console.warn(
//         `Retrying upload for file: ${file.path}. Retries left: ${retries}`
//       );
//       return await uploadFileWithRetry(file, retries - 1);
//     }
//     throw error;
//   }
// };

// // Create a new product
// router.post("/", upload.array("images", 10), async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       category,
//       price,
//       discountPercentage,
//       rating,
//       stock,
//       brand,
//       warrantyInformation,
//       shippingInformation,
//       returnPolicy,
//       condition,
//     } = req.body;

//     // Upload images to Cloudinary
//     const urls = await Promise.all(
//       req.files.map((file) => uploadFileWithRetry(file))
//     );
//     const images = urls.map((result) => result.secure_url);

//     // Create new product
//     const newProduct = await Product.create({
//       title,
//       description,
//       category,
//       price,
//       discountPercentage,
//       rating,
//       stock,
//       brand,
//       warrantyInformation,
//       shippingInformation,
//       returnPolicy,
//       meta: {
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         barcode: uuidv4(),
//         qrCode: uuidv4(),
//       },
//       images,
//       condition,
//     });

//     res.status(201).json(newProduct);
//   } catch (error) {
//     console.error("Error creating product:", error); // Log the error message
//     res.status(500).json({ message: `Error creating product: ${error.message}` });
//   }
// });

// router.post('/details', async (req, res) => {
//   try {
//     const productIds = req.body.productIds;
//     const products = await Product.find({ '_id': { $in: productIds } });
//     res.json(products);
//   } catch (error) {
//     console.error('Error fetching product details:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// //get product by category and filte
// router.get("/", async (req, res) => {
//   try {
//     const { category, priceRange, condition } = req.query;
//     // console.log(req.query);
//     let query = {};

//     if (category) {
//       if (mongoose.Types.ObjectId.isValid(category)) {
//         query.category = new mongoose.Types.ObjectId(category);
//       } else {
//         return res.status(400).json({ message: "Invalid category ID" });
//       }
//     }

//     if (priceRange) {
//       const [min, max] = priceRange.split(",");
//       query.price = { $gte: parseInt(min), $lte: parseInt(max) };
//     }

//     if (condition) {
//       query.condition = condition;
//     }
//     // console.log(query);
//     // const products = await Product.find(query);
//     const products = await Product.find(query).populate("category");
//     res.json(products);
//   } catch (error) {
//     console.error("Error fetching products:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

// // // Get all products
// // router.get("/", async (req, res) => {
// //   try {
// //     const products = await Product.find();
// //     res.json(products);
// //   } catch (error) {
// //     console.error("Error fetching products:", error.message);
// //     res.status(500).json({ message: error.message });
// //   }
// // });

// // Get product by ID
// router.get("/:id", async (req, res) => {
//   try {
//     // Fetch the product by ID and populate related fields
//     const product = await Product.findById(req.params._id)
//       .populate("category")
//       .populate("reviews");

//     // Check if the product exists
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // Respond with the product data
//     res.json(product);
//   } catch (error) {
//     console.error("Error fetching product by ID:", error.message);
//     // Respond with a 500 status code for server errors
//     res.status(500).json({ message: "An error occurred while fetching the product" });
//   }
// });


// // Delete product by ID
// router.delete("/:id", async (req, res) => {
//   try {
//     const deletedProduct = await Product.findByIdAndDelete(req.params.id);
//     if (!deletedProduct) {
//       return res.status(404).json({ message: "Product not found" });
//     }
//     res.json({ message: "Product deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting product:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Create a review for a specific product
// router.post("/:productId/reviews", async (req, res) => {
//   try {
//     const productId = req.params.productId;
//     const { rating, comment, reviewerName, reviewerEmail } = req.body;

//     // Validate the rating
//     if (isNaN(rating) || rating < 0 || rating > 5) {
//       return res.status(400).json({
//         message: "Invalid rating. Rating must be a number between 0 and 5",
//       });
//     }

//     // Create a new review
//     const newReview = await Review.create({
//       productId,
//       rating,
//       comment,
//       reviewerName,
//       reviewerEmail,
//     });

//     // Fetch the product and update its reviews and rating
//     const product = await Product.findById(productId).populate("reviews");
//     product.reviews.push(newReview._id);
//     product.numReviews = product.reviews.length;

//     // Calculate the new average rating for the product
//     let totalRating = 0;
//     for (const reviewId of product.reviews) {
//       const review = await Review.findById(reviewId);
//       totalRating += review.rating;
//     }
//     const newAverageRating = totalRating / product.numReviews;
//     product.rating = newAverageRating;

//     // Save the updated product
//     await product.save();

//     res.status(201).json(newReview);
//   } catch (error) {
//     console.error("Error creating review:", error);
//     res.status(400).json({ message: error.message });
//   }
// });


// router.get("/search/:key", async (req, res) => {
//     try {
//         const keyword = req.params.key;
        
//         // Search products by name and description
//         let data = await Product.find({
//             $or: [
//                 { name: { $regex: keyword, $options: 'i' } },
//                 { description: { $regex: keyword, $options: 'i' } }
//             ]
//         }).populate('category'); // Populate category field
        
//         // Include products where the category name matches the keyword
//         if (data.length === 0) {
//             const productsByCategory = await Product.find().populate('category');
//             data = productsByCategory.filter(product =>
//                 product.category && product.category.name.toLowerCase().includes(keyword.toLowerCase())
//             );
//         }

//         res.send(data);
//     } catch (error) {
//         console.error('Error searching for products:', error.message);
//         res.status(500).json({ message: 'Error searching for products' });
//     }
// });

// module.exports = router;
