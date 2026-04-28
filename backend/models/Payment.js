const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session:   { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  amount:    { type: Number, required: true },
  method:    { type: String, enum: ['Cash', 'Card', 'Bank Transfer'], required: true },
  status:    { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  reference: { type: String },
  paidAt:    { type: Date },
  receipt:   { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
