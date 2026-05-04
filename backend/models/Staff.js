const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  NIC: {
    type: String,
    required: [true, 'NIC is required'],
    unique: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required']
  },
  emergencyContact: {
    type: String,
    required: [true, 'Emergency contact is required']
  },
  
  // Staff specific fields
  department: {
    type: String,
    required: true,
    enum: ['Administration', 'Accounts', 'Operations', 'Customer Service', 'HR', 'IT Support']
  },
  position: {
    type: String,
    required: true
  },
  employmentType: {
    type: String,
    enum: ['Permanent', 'Contract', 'Intern'],
    default: 'Permanent'
  },
  joinDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  salary: {
    type: Number,
    required: true
  },
  workSchedule: {
    type: String,
    enum: ['Morning', 'Evening', 'Night', 'Full Day'],
    default: 'Full Day'
  },
  
  // Permissions and roles
  permissions: [{
    type: String,
    enum: [
      'manage_students',
      'manage_instructors',
      'manage_vehicles',
      'manage_sessions',
      'manage_payments',
      'manage_exams',
      'view_reports',
      'manage_staff',
      'send_notifications'
    ]
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Profile image
  image: {
    type: String
  },
  
  // Audit fields
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Hash password before saving
staffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
staffSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate employee ID automatically
staffSchema.pre('save', async function (next) {
  if (this.isNew && !this.employeeId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.employeeId = `STF${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Staff', staffSchema);
