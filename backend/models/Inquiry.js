const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  messageId: {
    type: String,
    unique: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  reply: {
    type: String,
    trim: true,
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  repliedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Open', 'Replied', 'Closed'],
    default: 'Open',
  },
}, { timestamps: true });

inquirySchema.pre('save', async function (next) {
  if (!this.messageId) {
    const count = await mongoose.model('Inquiry').countDocuments();
    this.messageId = `INQ${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

inquirySchema.index({ student: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
