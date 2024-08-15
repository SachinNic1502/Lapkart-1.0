// routes/category.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product =require('../models/Product')

// Create a new category
router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    let category = await Category.findOne({ name });
    if (category) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Create new category
    category = new Category({
      name,
      description,
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a category by ID
router.get('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a category
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, updatedAt: Date.now() },
      { new: true }
    );
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a category
router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.get('/:categoryName', async (req, res) => {
  try {
      const categoryName = req.params.categoryName;

      // Find the category by name
      const category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
      if (!category) {
          return res.status(404).json({ message: 'Category not found' });
      }

      // Find products by category ID
      const products = await Product.find({ category: category._id }).populate('category').populate('reviews');
      res.json(products);
  } catch (error) {
      console.error('Error fetching products by category name:', error.message);
      res.status(500).json({ message: error.message });
  }
});

module.exports = router;
