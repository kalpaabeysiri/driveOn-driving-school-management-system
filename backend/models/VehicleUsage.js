const mongoose = require('mongoose');

const vehicleUsageSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required'],
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
  },
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
  },
  vehicleModel: {
    type: String,
    required: [true, 'Vehicle model is required'],
  },
  km: {
    type: Number,
    required: [true, 'Kilometers are required'],
    min: [0, 'KM cannot be negative'],
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [0, 'Duration cannot be negative'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  notes: {
    type: String,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('VehicleUsage', vehicleUsageSchema);
