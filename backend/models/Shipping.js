const mongoose = require('mongoose');

const ShippingSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    shippingDate: { type: Date, default: Date.now },
    shippingMethod: { type: String, required: true },
    shippingStatus: { type: String, required: true },
    trackingNumber: { type: String },
    shippingAddress: { type: String, required: true }
});

module.exports = mongoose.model('Shipping', ShippingSchema);
