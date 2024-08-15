const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');



router.post('/:productId/reviews', async (req, res) => {
    const { rating, comment, date, reviewerName, reviewerEmail } = req.body;
    const { productId } = req.params;
  
    try {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid productId' });
      }
  
      const newReview = new Review({
        productId: mongoose.Types.ObjectId(productId),
        rating,
        comment,
        date,
        reviewerName,
        reviewerEmail,
      });
  
      await newReview.save();
  
      res.status(201).json(newReview);
    } catch (error) {
      console.error('Error creating review:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  });


// Find user details by user ID
router.get('/users/:userId/details', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ fullName: user.fullName, email: user.email });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
