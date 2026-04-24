const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    NIC: {
      type: String,
      required: [true, 'NIC is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (value) {
          const oldNIC = /^[0-9]{9}[vVxX]$/;
          const newNIC = /^[0-9]{12}$/;
          return oldNIC.test(value) || newNIC.test(value);
        },
        message: 'Enter a valid NIC. Example: 991234567V or 199912345678',
      },
    },

    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: 'Date of birth cannot be a future date',
      },
    },

    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },

    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },

    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: [true, 'Gender is required'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Enter a valid email address',
      },
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },

    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      validate: {
        validator: function (value) {
          return /^0[1-9][0-9]{8}$/.test(value);
        },
        message: 'Enter a valid Sri Lankan phone number. Example: 0712345678',
      },
    },

    emergencyContact: {
      type: String,
      required: [true, 'Emergency contact is required'],
      validate: {
        validator: function (value) {
          return /^0[1-9][0-9]{8}$/.test(value);
        },
        message: 'Enter a valid Sri Lankan phone number. Example: 0712345678',
      },
    },

    // Staff specific fields
    position: {
      type: String,
      required: [true, 'Position is required'],
      enum: ['Manager', 'Clerk'],
    },

    employmentType: {
      type: String,
      enum: ['Permanent', 'Contract', 'Intern'],
      default: 'Permanent',
    },

    joinDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [1, 'Salary must be greater than 0'],
    },

    // Permissions and roles
    permissions: [
      {
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
          'send_notifications',
        ],
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Profile image
    image: {
      type: String,
    },

    // Audit fields
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

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