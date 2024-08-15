const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { otpGen } = require('otp-gen-agent');
const router = express.Router();
const User = require('../models/User');

// Login with password
// router.post('/login', async (req, res) => {
//     try {
//         const { phoneNumber, password } = req.body;

//         if (!phoneNumber || !password) {
//             return res.status(400).json({ message: 'Phone number and password are required' });
//         }

//         const user = await User.findOne({ phoneNumber });

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) {
//             return res.status(401).json({ message: 'Invalid password' });
//         }

//         const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });
//         res.json({ token, user });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
    try {
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const payload = {
        id: user.id,
        phoneNumber: user.phoneNumber,
      };
  
      const token = jwt.sign(payload, 'your_jwt_secret', { expiresIn: '1h' }); // Replace 'your_jwt_secret' with your actual secret
  
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
// In-memory store for OTPs
let otpStore = {};

const generateExpiryTimestamp = () => {
    const now = Date.now();
    const fiveMinutesFromNow = now + 5 * 60 * 1000;
    return fiveMinutesFromNow;
};

router.post('/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        const otp = await otpGen();
        console.log("Generated OTP:", otp);

        const expiryTimestamp = generateExpiryTimestamp();
        otpStore[phoneNumber] = { otp, expiryTimestamp };

        console.log(`OTP for ${phoneNumber}: ${otp}`);
        console.log('Stored OTP:', otpStore[phoneNumber]);

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("Error generating OTP:", error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ message: 'Phone number and OTP are required' });
        }

        const storedOtpData = otpStore[phoneNumber];

        if (!storedOtpData) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        const { otp: storedOtp, expiryTimestamp } = storedOtpData;

        const now = Date.now();
        if (now > expiryTimestamp) {
            delete otpStore[phoneNumber];
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (storedOtp !== otp) {
            console.log('Invalid OTP');
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP is valid, find the user
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

        // Respond with token and user information
        res.json({ token, user });

        // Optionally, delete OTP from store after successful verification
        delete otpStore[phoneNumber];
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: error.message });
    }
});

// Forgot password - Generate OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = await otpGen();
        console.log("Generated OTP:", otp);

        const expiryTimestamp = generateExpiryTimestamp();
        otpStore[phoneNumber] = { otp, expiryTimestamp };

        console.log(`OTP for ${phoneNumber}: ${otp}`);
        console.log('Stored OTP:', otpStore[phoneNumber]);

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("Error generating OTP:", error);
        res.status(500).json({ message: error.message });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { phoneNumber, otp, newPassword } = req.body;

        if (!phoneNumber || !otp || !newPassword) {
            return res.status(400).json({ message: 'Phone number, OTP, and new password are required' });
        }

        const storedOtpData = otpStore[phoneNumber];

        if (!storedOtpData) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        const { otp: storedOtp, expiryTimestamp } = storedOtpData;

        const now = Date.now();
        if (now > expiryTimestamp) {
            delete otpStore[phoneNumber];
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (storedOtp !== otp) {
            console.log('Invalid OTP');
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password reset successfully' });

        delete otpStore[phoneNumber];
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
