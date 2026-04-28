const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  NIC: {
    type: String,
    required: [true, 'NIC is required'],
    unique: true,
    trim: true,
  },
  contactNo: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  emergencyContactNo: {
    type: String,
    required: [true, 'Emergency contact number is required'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  accountStatus: {
    type: String,
    enum: ['Active', 'Suspended'],
    default: 'Active',
  },
  reminderNotifications: {
    type: Boolean,
    default: false,
  },
  profileImage: {
    type: String,
  },

  // Reference attributes
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnrollmentCourse',
  }],
  bookedSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
  }],

  feedbacks: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Feedback',
  }],

  // Learning content module references
  quizAttempts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningQuizAttempt',
  }],
  lessonProgressRecords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentLessonProgress',
  }],

}, { timestamps: { createdAt: 'registeredDate', updatedAt: 'modifiedDate' } });

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Student', studentSchema);
