const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentID: {
    type: String,
    required: true,
    unique: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    required: true
  },
  razorpaySignature: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Payment', paymentSchema);

// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const paymentSchema = new Schema({
//     orderId: {
//         type: String,
//         required: true
//     },
//     paymentMethod: {
//         type: String,
//         enum: ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery', 'Razorpay'],
//         required: true
//     },
//     paymentStatus: {
//         type: String,
//         enum: ['Pending', 'Completed', 'Failed', 'COD Pending', 'Captured'],
//         required: true
//     },
//     paymentAmount: {
//         type: Number,
//         required: true
//     },
//     razorpayPaymentId: {
//         type: String
//     },
//     razorpayOrderId: {
//         type: String
//     },
//     razorpaySignature: {
//         type: String
//     },
//     paymentDate: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports = mongoose.model('Payment', paymentSchema);


