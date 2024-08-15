const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderID: { type: String, required: true },
  customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalAmount: { type: Number, required: true },
  orderStatus: { type: String, required: true },
  orderItems: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  defaultAddressID: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  paymentMethod: {
    type: String,
    enum: ['ONLINE', 'COD'], 
    required: true
  },
  paymentStatus: { type: String, required: true },
  paymentID: { type: String },
  paymentDate: { type: Date },
  orderDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);


// const mongoose = require('mongoose');

// const orderItemSchema = new mongoose.Schema({
//   productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//   quantity: { type: Number, required: true },
//   price: { type: Number, required: true }
// });

// const orderSchema = new mongoose.Schema({
//   orderID: { type: String, unique: true },
//   customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   orderDate: { type: Date, default: Date.now },
//   totalAmount: { type: Number, required: true },
//   orderStatus: { type: String, default: 'Pending' },
//   orderItems: [orderItemSchema],
//   defaultAddressID: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true } 
// });

// const Order = mongoose.model('Order', orderSchema);

// module.exports = Order;