const mongoose = require('mongoose');

const emiSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  paidDate: { type: Date },
});

const buyOnEmiSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  downPayment: { type: Number, required: true },
  loanTerm: { type: Number, required: true },
  annualInterestRate: { type: Number, required: true },
  processingFee: { type: Number, required: true },
  gstPercentage: { type: Number, required: true },
  totalLoanAmount: { type: Number, required: true },
  emiDetails: [emiSchema],
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
});

const BuyOnEmi = mongoose.model('BuyOnEmi', buyOnEmiSchema);

module.exports = BuyOnEmi;
