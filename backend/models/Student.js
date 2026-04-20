const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ─── Regex Validators ─────────────────────────────────────────────────────────
// Sri Lankan NIC: old = 9 digits + V/X  |  new = 12 digits
const NIC_REGEX   = /^([0-9]{9}[VvXx]|[0-9]{12})$/;

// Sri Lankan phone: starts with 0, exactly 10 digits
const PHONE_REGEX = /^0[0-9]{9}$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Schema ───────────────────────────────────────────────────────────────────
const studentSchema = new mongoose.Schema({

  firstName: {
    type:     String,
    required: [true, 'First name is required'],
    trim:     true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },

  lastName: {
    type:     String,
    required: [true, 'Last name is required'],
    trim:     true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },

  NIC: {
    type:     String,
    required: [true, 'NIC is required'],
    unique:   true,
    trim:     true,
    validate: {
      validator: (v) => NIC_REGEX.test(v),
      message:   'Invalid NIC format. Use 9 digits + V/X (old) or 12 digits (new).',
    },
  },

  contactNo: {
    type:     String,
    required: [true, 'Contact number is required'],
    trim:     true,
    validate: {
      validator: (v) => PHONE_REGEX.test(v),
      message:   'Contact number must be a valid 10-digit Sri Lankan number starting with 0.',
    },
  },

  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    validate: {
      validator: (v) => EMAIL_REGEX.test(v),
      message:   'Please enter a valid email address.',
    },
  },

  address: {
    type:     String,
    trim:     true,
    maxlength: [200, 'Address cannot exceed 200 characters'],
  },

  city: {
    type:     String,
    trim:     true,
    maxlength: [100, 'City cannot exceed 100 characters'],
  },

  emergencyContactNo: {
    type:  String,
    trim:  true,
    validate: {
      validator: (v) => !v || PHONE_REGEX.test(v),   // optional — skip if empty
      message:   'Emergency contact must be a valid 10-digit Sri Lankan number starting with 0.',
    },
  },

  dateOfBirth: {
    type: Date,
    validate: {
      validator: function (v) {
        if (!v) return true;               // optional
        const today = new Date();
        const minAge = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
        return v <= minAge;                // must be at least 16 years old
      },
      message: 'Student must be at least 16 years old.',
    },
  },

  gender: {
    type:  String,
    enum:  {
      values:  ['Male', 'Female', 'Other'],
      message: 'Gender must be Male, Female, or Other.',
    },
  },

  password: {
    type:      String,
    required:  [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },

  accountStatus: {
    type:    String,
    enum:    ['Active', 'Suspended'],
    default: 'Active',
  },

  reminderNotifications: {
    type:    Boolean,
    default: false,
  },

  profileImage: { type: String },

  // References
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modifiedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EnrollmentCourse' }],
  bookedSessions:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
  feedbacks:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }],

  quizAttempts:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningQuizAttempt' }],
  lessonProgressRecords:[{ type: mongoose.Schema.Types.ObjectId, ref: 'StudentLessonProgress' }],

}, { timestamps: { createdAt: 'registeredDate', updatedAt: 'modifiedDate' } });

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt  = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Student', studentSchema);