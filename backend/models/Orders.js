const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  buyOnEmiId: { type: Schema.Types.ObjectId, ref: 'BuyOnEmi', required: true },
  totalAmount: { type: Number },
  status: { type: String, required: true, default: 'pending' },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
