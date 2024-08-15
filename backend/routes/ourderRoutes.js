const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const BuyOnEmi = require('../models/BuyOnEmi');

router.post('/orders/create-order', async (req, res) => {
  try {
    console.log('Request body:', req.body);

    const { userId, productId, downPayment, loanTerm, annualInterestRate, processingFee, gstPercentage } = req.body;

    // Find the product by ID to ensure it exists and get its details
    const product = await Product.findById(productId);
    console.log("Product", product);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate EMI details
    const emiDetails = calculateEmiDetails(product.price, downPayment, loanTerm, annualInterestRate, processingFee, gstPercentage, product.refurbished);

    // Calculate total loan amount and total amount
    const totalLoanAmount = emiDetails.reduce((total, emi) => total + parseFloat(emi.amount), 0);
    const totalAmount = parseFloat(totalLoanAmount) + parseFloat(downPayment);

    console.log(`Total Loan Amount: ${totalLoanAmount}`);
    console.log(`Total Amount: ${totalAmount}`);

    // Create BuyOnEmi record
    const newBuyOnEmi = new BuyOnEmi({
      userId,
      productId,
      downPayment,
      loanTerm,
      annualInterestRate,
      processingFee,
      gstPercentage,
      emiDetails,
      totalLoanAmount,
      totalAmount
    });

    await newBuyOnEmi.save();

    // Create order
    const newOrder = new Order({
      userId,
      productId,
      buyOnEmiId: newBuyOnEmi._id, // Link the BuyOnEmi record
      totalAmount: newBuyOnEmi.totalAmount, // Total amount from BuyOnEmi
      status: 'pending', // Default status
    });

    console.log('New Order:', newOrder);

    await newOrder.save();

    res.status(201).json({ order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Function to calculate EMI details
const calculateEmiDetails = (price, downPayment, loanTerm, annualInterestRate, processingFee, gstPercentage, refurbished) => {
  const loanAmount = price - downPayment;
  const loanAmountWithFees = loanAmount + processingFee;
  const gstAmount = (loanAmountWithFees * gstPercentage) / 100;
  const totalLoanAmount = loanAmountWithFees + gstAmount;
  const monthlyInterestRate = annualInterestRate / 12 / 100;
  const numberOfMonths = loanTerm;

  const emiAmount = (totalLoanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfMonths)) /
                    (Math.pow(1 + monthlyInterestRate, numberOfMonths) - 1);

  const emiDetails = [];
  for (let i = 1; i <= loanTerm; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);
    emiDetails.push({
      amount: emiAmount.toFixed(2),
      dueDate,
      status: 'unpaid'
    });
  }

  return emiDetails;
};

router.get('/orders/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const orders = await Order.find({ userId }).populate('productId').populate('buyOnEmiId');
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching orders' });
    }
  });
// Get a single order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('productId buyOnEmiId');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order' });
  }
});

module.exports = router;
