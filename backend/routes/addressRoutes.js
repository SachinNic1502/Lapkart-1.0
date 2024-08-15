// routes/addresses.js

const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const User = require('../models/User');

// Add a new address for the logged-in user
router.post('/', verifyToken, async (req, res) => {
    try {
        const { houseNumber, buildingName, streetName, locality, city, state, postalCode, country, isDefault } = req.body;
        const userId = req.user.id;

        const newAddress = { houseNumber, buildingName, streetName, locality, city, state, postalCode, country, isDefault };

        // Find user by ID and add the new address
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Set all existing addresses to isDefault = false if new address is default
        if (isDefault) {
            user.addresses.forEach(address => address.isDefault = false);
        }

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json({ message: 'Address added successfully', address: newAddress });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

// Update an existing address by ID
router.put('/:addressId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.addressId;
        const { houseNumber, buildingName, streetName, locality, city, state, postalCode, country, isDefault } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Set all existing addresses to isDefault = false if updated address is default
        if (isDefault) {
            user.addresses.forEach(addr => {
                if (addr._id.toString() !== addressId) {
                    addr.isDefault = false;
                }
            });
        }

        address.houseNumber = houseNumber;
        address.buildingName = buildingName;
        address.streetName = streetName;
        address.locality = locality;
        address.city = city;
        address.state = state;
        address.postalCode = postalCode;
        address.country = country;
        address.isDefault = isDefault;

        await user.save();

        res.json({ message: 'Address updated successfully', address });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

// Delete a specific address by ID
router.delete('/:addressId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.addressId;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        address.remove();
        await user.save();

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch all addresses of the logged-in user
router.get('/address', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Find user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return user's addresses
        res.status(200).json(user.addresses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
