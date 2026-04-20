const mongoose = require('mongoose');

const vehicleClassSchema = new mongoose.Schema({
  vehicleClassName: {
    type: String,
    required: [true, 'Vehicle class name is required'],
    trim: true,
  },
  vehicleClassFee: {
    type: Number,
    required: [true, 'Vehicle class fee is required'],
    min: [0, 'Fee cannot be negative'],
  },
  licenseCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LicenseCategory',
    required: [true, 'License category is required'],
  },
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

module.exports = mongoose.model('VehicleClass', vehicleClassSchema);
