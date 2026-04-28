const mongoose = require('mongoose');

const insuranceMaintenanceSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required'],
  },
  // Insurance details
  insuranceProvider: {
    type: String,
    required: [true, 'Insurance provider is required'],
    trim: true,
  },
  policyNumber: {
    type: String,
    required: [true, 'Policy number is required'],
    unique: true,
    trim: true,
  },
  insuranceExpiryDate: {
    type: Date,
    required: [true, 'Insurance expiry date is required'],
  },
  // Emission test
  emissionTestExpiryDate: {
    type: Date,
    required: [true, 'Emission test expiry date is required'],
  },
  // Maintenance
  lastMaintenanceDate: {
    type: Date,
    required: [true, 'Last maintenance date is required'],
  },
  nextMaintenanceDate: {
    type: Date,
  },
  maintenanceNotes: {
    type: String,
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Virtual to check if insurance is expiring within 30 days
insuranceMaintenanceSchema.virtual('insuranceExpiringSoon').get(function () {
  const today = new Date();
  const daysUntilExpiry = Math.ceil((this.insuranceExpiryDate - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
});

// Virtual to check if emission test is expiring within 30 days
insuranceMaintenanceSchema.virtual('emissionExpiringSoon').get(function () {
  const today = new Date();
  const daysUntilExpiry = Math.ceil((this.emissionTestExpiryDate - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
});

insuranceMaintenanceSchema.set('toJSON', { virtuals: true });
insuranceMaintenanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('InsuranceMaintenance', insuranceMaintenanceSchema);
