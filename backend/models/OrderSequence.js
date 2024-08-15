const mongoose = require('mongoose');

const orderSequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const OrderSequence = mongoose.model('OrderSequence', orderSequenceSchema);

module.exports = OrderSequence;
