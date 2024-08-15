const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const verifyToken = require('../middlewares/authMiddleware');
const ObjectId = mongoose.Types.ObjectId;

// Get the cart for the authenticated user
router.get('/cartItem', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add an item to the cart
router.post('/add', verifyToken, async (req, res) => {
  const { productId, quantity } = req.body;

  // console.log(productId);

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (productIndex > -1) {
      cart.items[productIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.log('Error adding item to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove an item from the cart
// router.post('/remove', verifyToken, async (req, res) => {
//   const { productId } = req.body;
  
//   const userId = req.user.id;
//   console.log(userId);
//   if (!mongoose.Types.ObjectId.isValid(productId)) {
//     return res.status(400).json({ message: 'Invalid product ID' });
//   }

//   try {
//     const cart = await Cart.findOne({ userId }).populate('items.productId');

//     if (!cart) {
//       return res.status(404).json({ message: 'Cart not found' });
//     }

//     cart.items = cart.items.filter(item => !item.productId.equals(productId));

//     await cart.save();
//     res.json(cart);
//   } catch (error) {
//     console.log('Error removing item from cart:', error.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Remove an item from the cart
router.delete('/remove/:itemId', verifyToken, async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;

  // console.log(`Attempting to remove itemId: ${itemId} for userId: ${userId}`);

  if (!ObjectId.isValid(itemId)) {
    return res.status(400).json({ message: 'Invalid item ID' });
  }

  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) {
      console.log('Cart not found for user:', userId);
      return res.status(404).json({ message: 'Cart not found' });
    }

    // console.log('Cart items before removal:', cart.items);

    const originalLength = cart.items.length;
    const itemIdObject = new ObjectId(itemId); // Convert to ObjectId

    cart.items = cart.items.filter(item => {
      // console.log(`Comparing item._id: ${item._id.toString()} with itemId: ${itemIdObject.toString()}`);
      return !item._id.equals(itemIdObject);
    });

    const newLength = cart.items.length;
    // console.log(`New items length: ${newLength}`);

    if (originalLength === newLength) {
      console.log('Item not found in cart');
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.log('Error removing item from cart:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/increase/:itemId', verifyToken, async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;

  if (!ObjectId.isValid(itemId)) {
    return res.status(400).json({ message: 'Invalid item ID' });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.equals(itemId));

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += 1;
      await cart.save();
      res.json(cart);
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    console.log('Error increasing item quantity:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decrease the quantity of an item in the cart
router.post('/decrease/:itemId', verifyToken, async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;

  if (!ObjectId.isValid(itemId)) {
    return res.status(400).json({ message: 'Invalid item ID' });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.equals(itemId));

    if (itemIndex > -1) {
      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1;
        await cart.save();
        res.json(cart);
      } else {
        res.status(400).json({ message: 'Quantity cannot be less than 1' });
      }
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    console.log('Error decreasing item quantity:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear the entire cart
router.delete('/clear', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
