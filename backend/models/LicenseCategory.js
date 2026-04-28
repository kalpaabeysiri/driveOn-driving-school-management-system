const mongoose = require('mongoose');

const licenseCategorySchema = new mongoose.Schema({
  licenseCategoryName: {
    type: String,
    required: [true, 'License category name is required'],
    unique: true,
    trim: true,
  },
  vehicleClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleClass',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

module.exports = mongoose.model('LicenseCategory', licenseCategorySchema);
