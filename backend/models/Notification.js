const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, 'Message is required'],
  },
  status: {
    type: String,
    enum: ['Unread', 'Read'],
    default: 'Unread',
  },
  type: {
    type: String,
    enum: [
      'SessionAssigned', 'SessionCancelled', 'InsuranceExpiry', 'MaintenanceDue', 
      'General', 'ExamScheduled', 'ExamResult', 'PaymentReminder', 'Notice', 
      'SystemUpdate', 'Holiday', 'Urgent'
    ],
    default: 'General',
  },
  // Recipients - can target different user types
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  },
  // For broadcast to all users of a type
  broadcastTo: {
    type: String,
    enum: ['AllStudents', 'AllInstructors', 'AllStaff', 'AllUsers'],
  },
  // Related entities
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'examType',
  },
  examType: {
    type: String,
    enum: ['TheoryExam', 'PracticalExam'],
  },
  // Additional metadata
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal',
  },
  actionUrl: {
    type: String, // Deep link or route to navigate to when tapped
  },
  scheduledFor: {
    type: Date, // For scheduled notifications
  },
  expiresAt: {
    type: Date, // Notification auto-removes after this date
  },
  // Tracking
  sentVia: {
    type: String,
    enum: ['InApp', 'Email', 'SMS', 'Push'],
    default: 'InApp',
  },
  readAt: {
    type: Date,
  },
}, { timestamps: { createdAt: 'date', updatedAt: 'updatedAt' } });

// Indexes
notificationSchema.index({ student: 1, status: 1, date: -1 });
notificationSchema.index({ instructor: 1, status: 1, date: -1 });
notificationSchema.index({ staff: 1, status: 1, date: -1 });
notificationSchema.index({ broadcastTo: 1, status: 1, date: -1 });
notificationSchema.index({ type: 1, date: -1 });
notificationSchema.index({ priority: 1, date: -1 });

// TTL index for auto-expiring notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
