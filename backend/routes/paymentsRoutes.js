const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const verifyToken = require('../middlewares/authMiddleware');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Initialize Razorpay instance with your credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_NvFg6zPzqUithL',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'X87R853Z4x4vkoJ1WowUsbVl'
});

// Create a new order
router.post('/create-order', verifyToken, 
  body('amount').isInt({ gt: 0 }).withMessage('Amount must be a positive integer'),
  body('receipt').notEmpty().withMessage('Receipt is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { amount, receipt } = req.body;
      const options = {
        amount: amount,
        currency: 'INR',
        receipt: receipt,
        payment_capture: 1 // Auto-capture
      };

      const order = await razorpay.orders.create(options);
      res.json({ order_id: order.id });
    } catch (err) {
      res.status(500).json({ message: 'Error creating Razorpay order', error: err.message });
    }
  }
);

// Capture Razorpay Payment
router.post('/paymentCapture', verifyToken, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, orderId } = req.body;

    const hmac = crypto.createHmac('sha256', razorpay.key_secret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      console.error('Invalid signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const payment = new Payment({
      paymentID: razorpayPaymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount:amount/100,
      status: 'Completed',
      orderID: new mongoose.Types.ObjectId(orderId)
    });

    await payment.save();

    const order = await Order.findById(orderId).populate('orderItems.productId');
    console.log(order);
    if (!order) {
      console.error('Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentID = payment._id;
    // order.orderStatus = 'Completed';
    await order.save();

    // for (let item of order.orderItems) {
    //   const product = item.productId;
    //   product.quantity -= item.quantity;
    //   await product.save();
    // }

    const userId = req.user._id;
    await Cart.deleteMany({ userId });


    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payments
router.get('/all', async (req, res) => {
  try {
    const payments = await Payment.find();
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;










// const express = require('express');
// const Razorpay = require('razorpay');
// const crypto = require('crypto');
// const verifyToken = require('../middlewares/authMiddleware');
// const router = express.Router();
// const { body, validationResult } = require('express-validator');
// const  Order  = require('../models/Order');
// const  Payment  = require('../models/Payment');

// // Initialize Razorpay instance with your credentials
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_NvFg6zPzqUithL', // Use environment variables or fallback to defaults for testing
//   key_secret: process.env.RAZORPAY_KEY_SECRET || 'X87R853Z4x4vkoJ1WowUsbVl'
// });

// // Create a new order
// router.post('/create-order', verifyToken, 
//   body('amount').isInt({ gt: 0 }).withMessage('Amount must be a positive integer'),
//   body('receipt').notEmpty().withMessage('Receipt is required'),
//   async (req, res) => {
//     // Validate the request body
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     try {
//       const { amount, receipt } = req.body;
//       const options = {
//         amount: amount,
//         currency: 'INR',
//         receipt: receipt,
//       };

//       const order = await razorpay.orders.create(options);
//       res.json({ order_id: order.id });
//     } catch (err) {
//       res.status(500).json({ message: 'Error creating Razorpay order', error: err.message });
//     }
//   }
// );

// // Capture Razorpay Payment
// router.post('/paymentCapture', async (req, res) => {
//     const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;
  
//     const hmac = crypto.createHmac('sha256', razorpay.key_secret);
//     hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
//     const generatedSignature = hmac.digest('hex');
  
//     if (generatedSignature === razorpaySignature) {
//       try {
//         const captureResponse = await razorpay.payments.capture(razorpayPaymentId, amount);
//         return res.status(200).json({ status: 'ok', captureResponse });
//       } catch (error) {
//         console.error('Error capturing payment:', error);
//         return res.status(500).json({ status: 'error', error: 'Error capturing payment' });
//       }
//     } else {
//       return res.status(400).json({ status: 'error', error: 'Invalid signature' });
//     }
//   });


// module.exports = router;
