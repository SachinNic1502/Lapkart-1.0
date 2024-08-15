// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/authMiddleware');

// @desc    Register seller
// @route   POST /api/sellers/register
// @access  Public
router.post('/register', async (req, res) => {
    console.log(req.body);

    const { sellerName, sellerEmail, sellerPassword } = req.body;

    if (!sellerName || !sellerEmail || !sellerPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if the email already exists
        const existingSeller = await Seller.findOne({ sellerEmail });
        if (existingSeller) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(sellerPassword, 10);

        // Create a new seller
        const newSeller = new Seller({
            sellerName,
            sellerEmail,
            sellerPassword: hashedPassword
        });

        await newSeller.save();
        res.status(201).json({ message: 'Seller registered successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { sellerEmail, sellerPassword } = req.body;
    console.log(req.body);
    

    try {
        // Check if seller exists
        const seller = await Seller.findOne({ sellerEmail });

        // Debugging output
        console.log('Seller:', seller);
        console.log('Input Password:', sellerPassword);

        if (seller && sellerPassword && await bcrypt.compare(sellerPassword, seller.sellerPassword)) {
            // Generate JWT token
            const token = jwt.sign(
                { id: seller._id, email: seller.sellerEmail },
                process.env.JWT_SECRET, // Ensure you have JWT_SECRET in your environment variables
                { expiresIn: '7d' }
            );

            console.log('Generated Token:', token); // Debugging output

            res.json({
                token,
                _id: seller._id,
                sellerName: seller.sellerName,
                sellerEmail: seller.sellerEmail,
                sellerPhone: seller.sellerPhone,
                sellerAddress: seller.sellerAddress,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error); // Log error details for debugging
        res.status(500).json({ message: 'Server error' });
    }
});


// @desc    Forgot password
// @route   POST /api/sellers/forgotpassword
// @access  Public
router.post('/forgotpassword', async (req, res) => {
    const { sellerEmail } = req.body;

    try {
        const seller = await Seller.findOne({ sellerEmail });

        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        const resetToken = seller.getResetPasswordToken();
        await seller.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/api/sellers/resetpassword/${resetToken}`;

        const message = `
            You are receiving this email because you (or someone else) has requested the reset of a password.
            Please make a PUT request to:
            ${resetUrl}
        `;

        // await sendEmail({
        //   email: seller.sellerEmail,
        //   subject: 'Password reset token',
        //   message,
        // });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (error) {
        seller.resetPasswordToken = undefined;
        seller.resetPasswordExpire = undefined;
        await seller.save();
        res.status(500).json({ message: 'Email could not be sent' });
    }
});

// @desc    Reset password
// @route   PUT /api/sellers/resetpassword/:resetToken
// @access  Public
router.put('/resetpassword/:resetToken', async (req, res) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

    try {
        const seller = await Seller.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!seller) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        seller.sellerPassword = req.body.sellerPassword; // Use correct field name
        await seller.save();

        res.status(200).json({ success: true, data: 'Password updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await Seller.findById(req.user.id).select('-sellerPassword');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/getAllOrders', async (req, res) => {
    try {
      // Fetch all orders from the database
      const orders = await Order.find(); // Adjust this according to your data model
  
      // Return the orders as JSON
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

module.exports = router;
