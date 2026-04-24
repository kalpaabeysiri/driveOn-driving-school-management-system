const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },

  amount: {
    type: Number,
    required: true
  },

  method: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer'],
    required: true
  },

  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: function () {
      return this.method === 'Bank Transfer' ? 'Pending' : 'Completed';
    }
  },

  reference: {
    type: String,
    trim: true
  },

  paidAt: {
    type: Date,
    default: function () {
      return this.status === 'Completed' ? Date.now : undefined;
    }
  },

  receipt: {
    type: String
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  verifiedAt: {
    type: Date
  },

  note: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);