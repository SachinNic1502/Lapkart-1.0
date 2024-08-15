// models/Seller.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  sellerName: { type: String, required: true },
  sellerEmail: { type: String, required: true, unique: true },
  sellerPassword: { type: String, required: true },
  sellerPhone: { type: String },
  sellerAddress: { type: String },
  sellerRating: { type: Number, default: 0 },
  sellerJoinedDate: { type: Date, default: Date.now },
  sellerVerified: { type: Boolean, default: false },
  sellerProfilePicture: { type: String }
});

// Method to match password
sellerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.sellerPassword);
};

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;
