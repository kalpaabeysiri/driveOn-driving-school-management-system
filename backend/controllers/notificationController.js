const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Instructor = require('../models/Instructor');
const Staff = require('../models/Staff');

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications
// @access Private
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const user = req.user;
    
    // Build filter based on user role
    let filter = {};
    if (unreadOnly === 'true') {
      filter.status = 'Unread';
    }
    
    // Filter by user type
    if (user.role === 'student') {
      filter.$or = [
        { student: user.id },
        { broadcastTo: 'AllStudents' },
        { broadcastTo: 'AllUsers' }
      ];
    } else if (user.role === 'instructor') {
      filter.$or = [
        { instructor: user.id },
        { broadcastTo: 'AllInstructors' },
        { broadcastTo: 'AllUsers' }
      ];
    } else if (user.role === 'staff') {
      filter.$or = [
        { staff: user.id },
        { broadcastTo: 'AllStaff' },
        { broadcastTo: 'AllUsers' }
      ];
    } else if (user.role === 'admin') {
      // Admins can see all notifications
      filter = {};
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ priority: -1, date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter)
    ]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send notification to specific users or broadcast
// @route   POST /api/notifications
// @access Private (Admin only)
const sendNotification = async (req, res) => {
  try {
    const {
      message,
      type,
      priority = 'Normal',
      recipients,
      broadcastTo,
      actionUrl,
      expiresAt
    } = req.body;

    let notifications = [];

    // Handle broadcast
    if (broadcastTo) {
      let users = [];
      
      switch (broadcastTo) {
        case 'AllStudents':
          users = await Student.find({ accountStatus: 'Active' }).select('_id');
          notifications = users.map(student => ({
            message,
            type,
            priority,
            student: student._id,
            broadcastTo,
            actionUrl,
            expiresAt,
            sentVia: 'InApp'
          }));
          break;
          
        case 'AllInstructors':
          users = await Instructor.find({ available: true }).select('_id');
          notifications = users.map(instructor => ({
            message,
            type,
            priority,
            instructor: instructor._id,
            broadcastTo,
            actionUrl,
            expiresAt,
            sentVia: 'InApp'
          }));
          break;
          
        case 'AllStaff':
          users = await Staff.find({ isActive: true }).select('_id');
          notifications = users.map(staff => ({
            message,
            type,
            priority,
            staff: staff._id,
            broadcastTo,
            actionUrl,
            expiresAt,
            sentVia: 'InApp'
          }));
          break;
          
        case 'AllUsers':
          // Create notifications for all user types
          const [students, instructors, staff] = await Promise.all([
            Student.find({ accountStatus: 'Active' }).select('_id'),
            Instructor.find({ available: true }).select('_id'),
            Staff.find({ isActive: true }).select('_id')
          ]);
          
          notifications = [
            ...students.map(student => ({
              message,
              type,
              priority,
              student: student._id,
              broadcastTo,
              actionUrl,
              expiresAt,
              sentVia: 'InApp'
            })),
            ...instructors.map(instructor => ({
              message,
              type,
              priority,
              instructor: instructor._id,
              broadcastTo,
              actionUrl,
              expiresAt,
              sentVia: 'InApp'
            })),
            ...staff.map(staff => ({
              message,
              type,
              priority,
              staff: staff._id,
              broadcastTo,
              actionUrl,
              expiresAt,
              sentVia: 'InApp'
            }))
          ];
          break;
      }
    } 
    // Handle specific recipients
    else if (recipients && recipients.length > 0) {
      notifications = recipients.map(recipient => ({
        message,
        type,
        priority,
        ...recipient, // Contains student/instructor/staff ID
        actionUrl,
        expiresAt,
        sentVia: 'InApp'
      }));
    }

    // Insert all notifications
    const result = await Notification.insertMany(notifications);

    res.status(201).json({
      message: 'Notifications sent successfully',
      count: result.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access Private
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user owns this notification
    const user = req.user;
    const isOwner =
      (user.role === 'student'    && notification.student?.toString()    === user.id) ||
      (user.role === 'instructor' && notification.instructor?.toString() === user.id) ||
      (user.role === 'staff'      && notification.staff?.toString()      === user.id) ||
      user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.status = 'Read';
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read for user
// @route   PATCH /api/notifications/read-all
// @access Private
const markAllNotificationsRead = async (req, res) => {
  try {
    const user = req.user;
    
    // Build filter based on user role
    let filter = { status: 'Unread' };
    
    if (user.role === 'student') {
      filter.student = user.id;
    } else if (user.role === 'instructor') {
      filter.instructor = user.id;
    } else if (user.role === 'staff') {
      filter.staff = user.id;
    }

    const result = await Notification.updateMany(
      filter,
      { 
        status: 'Read',
        readAt: new Date()
      }
    );

    res.json({ 
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user owns this notification or is admin
    const user = req.user;
    const isOwner =
      (user.role === 'student'    && notification.student?.toString()    === user.id) ||
      (user.role === 'instructor' && notification.instructor?.toString() === user.id) ||
      (user.role === 'staff'      && notification.staff?.toString()      === user.id) ||
      user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access Private (Admin)
const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUnread = await Notification.countDocuments({ status: 'Unread' });

    res.json({
      statusDistribution: stats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      typeDistribution: typeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totalUnread
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  sendNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationStats
};
