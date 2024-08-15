const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const BuyOnEmi = require('../models/BuyOnEmi');
const Order = require('../models/Order');

// Make a payment for an EMI
router.post('/pay-emi', async (req, res) => {
  const { paymentId } = req.body;

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = 'paid';
    payment.paymentDate = new Date();
    await payment.save();

    const emi = await BuyOnEmi.findById(payment.emiId);
    emi.status = 'paid';
    emi.paidDate = new Date();
    await emi.save();

    const order = await Order.findById(payment.orderId);
    const unpaidEmis = await Payment.find({ orderId: order._id, status: 'unpaid' });
    if (unpaidEmis.length === 0) {
      order.status = 'completed';
      await order.save();
    }

    res.json({ message: 'EMI payment successful', payment, order });
  } catch (error) {
    res.status(500).json({ error: 'Error processing payment' });
  }
});

// Get all payments for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId }).populate('orderId emiId');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching payments' });
  }
});

// Get a single payment by ID
router.get('/:paymentId', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate('orderId emiId');
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching payment' });
  }
});

module.exports = router;
