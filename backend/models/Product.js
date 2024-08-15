const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const productSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  discountPercentage: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  stock: { type: Number, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  warrantyInformation: { type: String },
  shippingInformation: { type: String },
  returnPolicy: { type: String },
  condition: { type: String, required: true },
  specifications: { type: Map, of: String },
  meta: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    barcode: { type: String, default: uuidv4 },
    qrCode: { type: String, default: uuidv4 }
  },
  images: [{ type: String }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;


// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const productSchema = new Schema({
//     title: { type: String, required: true },
//     description: { type: String, required: true },
//     category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
//     price: { type: Number, required: true },
//     discountPercentage: { type: Number, required: true },
//     rating: { type: Number, default: 0 },
//     numReviews: { type: Number, default: 0 },
//     stock: { type: Number, required: true },
//     brand: { type: String, required: true },
//     warrantyInformation: { type: String, required: true },
//     shippingInformation: { type: String, required: true },
//     returnPolicy: { type: String, required: true },
//     condition: { type: String, required: true },
//     meta: {
//         createdAt: { type: Date, default: Date.now },
//         updatedAt: { type: Date, default: Date.now },
//         barcode: { type: String },
//         qrCode: { type: String }
//     },
//     images: [{ type: String }],
//     reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
// });

// const Product = mongoose.model('Product', productSchema);

// module.exports = Product;
