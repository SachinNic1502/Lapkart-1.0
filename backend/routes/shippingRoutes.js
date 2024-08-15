const express = require('express');
const router = express.Router();
const Shipping = require('../models/Shipping');
const verifyToken = require('../middlewares/authMiddleware');

// Create a new shipping
router.post('/add', verifyToken, async (req, res) => {
    const { orderId, shippingMethod, shippingStatus, trackingNumber, shippingAddress } = req.body;

    try {
        const newShipping = new Shipping({ orderId, shippingMethod, shippingStatus, trackingNumber, shippingAddress });
        await newShipping.save();
        res.status(201).json(newShipping);
    } catch (error) {
        console.error('Error creating shipping:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
