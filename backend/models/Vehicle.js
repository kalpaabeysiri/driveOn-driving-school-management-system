const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
  },
  vehicleType: {
    type: String,
    enum: ['Car', 'Van', 'Motorcycle', 'Bus', 'Truck'],
    required: [true, 'Vehicle type is required'],
  },
  transmission: {
    type: String,
    enum: ['Manual', 'Automatic'],
    required: [true, 'Transmission type is required'],
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
    required: [true, 'Fuel type is required'],
  },
  available: {
    type: Boolean,
    default: true,
  },
  usageStatus: {
    type: String,
    enum: ['Active', 'In Use', 'Under Maintenance', 'Retired'],
    default: 'Active',
  },
  image: {
    type: String,
  },
  // Legacy fields for compatibility
  make:        { type: String },
  plateNumber: { type: String },
  type:        { type: String },

  // Reference attributes
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
  }],
  insuranceDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InsuranceMaintenance',
  },

}, { timestamps: true });

// Sync legacy fields
vehicleSchema.pre('save', function (next) {
  this.make        = this.brand;
  this.plateNumber = this.licensePlate;
  this.type        = this.transmission;
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
