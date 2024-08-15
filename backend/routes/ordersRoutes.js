const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderSequence = require('../models/OrderSequence');
const verifyToken = require('../middlewares/authMiddleware');
const User = require('../models/User')

async function getNextOrderID() {
  try {
    const sequenceDocument = await OrderSequence.findByIdAndUpdate(
      { _id: 'order_seq' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return `ORD${sequenceDocument.seq.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error getting next order ID:', error);
    throw new Error('Error getting next order ID');
  }
}

router.post('/add', verifyToken, async (req, res) => {
  try {
    const {
      customerID,
      totalAmount,
      orderStatus,
      orderItems,
      defaultAddressID,
      paymentMethod,
      paymentID
    } = req.body;

    const nextOrderID = await getNextOrderID();

    const order = new Order({
      orderID: nextOrderID,
      customerID,
      totalAmount,
      orderStatus,
      orderItems,
      defaultAddressID,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Initiated',
      paymentID: paymentMethod === 'ONLINE' ? paymentID : null,
      orderDate: new Date()
    });

    const savedOrder = await order.save();

    if (paymentMethod === 'COD') {
      return res.status(201).json({ orderID: savedOrder._id });
    }

    res.status(201).json({ orderID: savedOrder._id, razorpayOrderID: null });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// router.get('/orderlist', verifyToken, async (req, res) => {
//   try {
//     // Use req.user.id as it matches the response
//     const orders = await Order.find({ customerID: req.user.id }).populate('orderItems.productId');
//     res.json(orders);
//   } catch (error) {
//     console.error('Error fetching orders:', error.message);
//     res.status(500).json({ message: 'Error fetching orders' });
//   }
// });
router.get('/orderlist', verifyToken, async (req, res) => {
  try {
    // Fetch orders for the current user
    const orders = await Order.find({ customerID: req.user.id }).populate('orderItems.productId').exec();

    // Extract unique customer IDs from orders
    const customerIDs = [...new Set(orders.map(order => order.customerID))];
    
    // Fetch customer details for all customer IDs
    const customers = await User.find({ _id: { $in: customerIDs } }).exec();
    
    // Create a map for quick access to customer details by ID
    const customerMap = customers.reduce((acc, customer) => {
      acc[customer._id] = customer;
      return acc;
    }, {});

    // Attach customer details to each order
    const ordersWithCustomerDetails = orders.map(order => ({
      ...order.toObject(),
      customer: customerMap[order.customerID]
    }));

    res.json(ordersWithCustomerDetails);
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});
// Route to get all orders
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

router.get('/:orderId', verifyToken, async (req, res) => {
  const { orderId } = req.params;
  console.log(orderId);
  
  try {
    // Find order by orderId and populate orderItems with product details
    const order = await Order.findById(orderId).populate('orderItems.productId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:orderId', async (req, res) => {
  const { orderId } = req.params; // Correctly extract orderId from the params
  const { orderStatus } = req.body;

  try {
    // Find the order by ID and update its status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId, // Use the correct parameter name
      { orderStatus },
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order status:', err); // Log the error for debugging
    res.status(500).json({ message: 'Error updating order status' });
  }
});



module.exports = router;



// const express = require('express');
// const router = express.Router();
// const Order = require('../models/Order');
// const OrderSequence = require('../models/OrderSequence');
// const verifyToken = require('../middlewares/authMiddleware');

// async function getNextOrderID() {
//   const sequenceDocument = await OrderSequence.findByIdAndUpdate(
//     { _id: 'order_seq' },
//     { $inc: { seq: 1 } },
//     { new: true, upsert: true }
//   );
//   return `ORD ${sequenceDocument.seq.toString().padStart(3, '0')}`;
// }

// router.post('/add', verifyToken, async (req, res) => {
//   try {
//     const { customerID, totalAmount, orderStatus, orderItems, defaultAddressID } = req.body;

//     const nextOrderID = await getNextOrderID();

//     const order = new Order({
//       orderID: nextOrderID,
//       customerID,
//       totalAmount,
//       orderStatus,
//       orderItems,
//       defaultAddressID
//     });

//     await order.save();

//     res.status(201).json(order);
//   } catch (error) {
//     console.error('Error creating order:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// router.post('/cod', verifyToken, async (req, res) => {
//   try {
//     const {
//       customerID,
//       totalAmount,
//       orderStatus,
//       orderItems,
//       defaultAddressID,
//       paymentMethod,
//     } = req.body;

//     const order = new Order({
//       customerID,
//       totalAmount,
//       orderStatus,
//       orderItems,
//       defaultAddressID,
//       paymentMethod,
//     });

//     const savedOrder = await order.save();
//     res.status(201).json({ orderID: savedOrder._id });
//   } catch (error) {
//     console.error('Error creating COD order:', error);
//     res.status(500).json({ message: 'Error creating COD order. Please try again later.' });
//   }
// });

// module.exports = router;
