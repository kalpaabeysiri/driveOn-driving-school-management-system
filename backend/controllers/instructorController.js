const Instructor   = require('../models/Instructor');
const Notification = require('../models/Notification');
const Session      = require('../models/Session');
const jwt          = require('jsonwebtoken');

const generateToken = (instructor) =>
  jwt.sign({ id: instructor._id, role: 'instructor' }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── CREATE ───────────────────────────────────────────────────────────────────
// @route POST /api/instructors

const createInstructor = async (req, res) => {
  
  try {
    const {
      fullName, NIC, dateOfBirth, address, city, gender,
      email, password, contactNumber, emergencyContact,
      licenseNo, experience, specialization,
    } = req.body;

    if (!fullName || !NIC || !email || !password || !contactNumber) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const exists = await Instructor.findOne({ $or: [{ email }, { NIC }] });
    if (exists) return res.status(400).json({ message: 'Instructor with this email or NIC already exists' });

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const instructor = await Instructor.create({
      fullName, NIC, dateOfBirth, address, city, gender,
      email, password, contactNumber, emergencyContact,
      licenseNo, experience, specialization, image,
      registeredBy: req.user.id,
    });

    res.status(201).json({
      _id:      instructor._id,
      fullName: instructor.fullName,
      email:    instructor.email,
      NIC:      instructor.NIC,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET ALL ──────────────────────────────────────────────────────────────────
// @route GET /api/instructors
const getAllInstructors = async (req, res) => {
  try {
    const { search, available, specialization } = req.query;
    const filter = {};

    if (available !== undefined) filter.available = available === 'true';
    if (specialization) filter.specialization = specialization;
    if (search) filter.$or = [
      { fullName:      { $regex: search, $options: 'i' } },
      { email:         { $regex: search, $options: 'i' } },
      { NIC:           { $regex: search, $options: 'i' } },
      { contactNumber: { $regex: search, $options: 'i' } },
    ];

    const instructors = await Instructor.find(filter)
      .select('-password')
      .populate('registeredBy', 'name')
      .populate('modifiedBy',   'name')
      .populate('assignedVehicles', 'licensePlate brand model')
      .sort({ createdAt: -1 });

    res.json(instructors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET BY ID ────────────────────────────────────────────────────────────────
// @route GET /api/instructors/:id
const getInstructorById = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
      .select('-password')
      .populate('registeredBy',     'name email')
      .populate('modifiedBy',       'name email')
      .populate('assignedVehicles', 'licensePlate brand model vehicleType available')
      .populate('notifications')
      .populate({
        path: 'sessions',
        populate: [
          { path: 'vehicle', select: 'brand model licensePlate' },
        ],
      });

    if (!instructor) return res.status(404).json({ message: 'Instructor not found' });
    res.json(instructor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
// @route PUT /api/instructors/:id
const updateInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ message: 'Instructor not found' });

    const allowedFields = [
      'fullName', 'dateOfBirth', 'address', 'city', 'gender',
      'email', 'contactNumber', 'emergencyContact', 'licenseNo',
      'experience', 'specialization', 'available',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) instructor[field] = req.body[field];
    });

    if (req.file)         instructor.image      = `/uploads/${req.file.filename}`;
    if (req.body.password) instructor.password  = req.body.password;
    instructor.modifiedBy = req.user.id;

    const updated = await instructor.save();
    res.json({ _id: updated._id, fullName: updated.fullName, email: updated.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE ───────────────────────────────────────────────────────────────────
// @route DELETE /api/instructors/:id
const deleteInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ message: 'Instructor not found' });
    await Notification.deleteMany({ instructor: instructor._id });
    await instructor.deleteOne();
    res.json({ message: 'Instructor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ASSIGN VEHICLE ───────────────────────────────────────────────────────────
// @route POST /api/instructors/:id/assign-vehicle
const assignVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ message: 'Instructor not found' });

    if (instructor.assignedVehicles.includes(vehicleId)) {
      return res.status(400).json({ message: 'Vehicle already assigned to this instructor' });
    }

    instructor.assignedVehicles.push(vehicleId);
    await instructor.save();
    res.json({ message: 'Vehicle assigned successfully', assignedVehicles: instructor.assignedVehicles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── REMOVE VEHICLE ───────────────────────────────────────────────────────────
// @route DELETE /api/instructors/:id/assign-vehicle/:vehicleId
const removeVehicle = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ message: 'Instructor not found' });

    instructor.assignedVehicles = instructor.assignedVehicles.filter(
      v => v.toString() !== req.params.vehicleId
    );
    await instructor.save();
    res.json({ message: 'Vehicle removed from instructor' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET NOTIFICATIONS ─────────────────────────────────────────────────────────
// @route GET /api/instructors/:id/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ instructor: req.params.id })
      .populate('session', 'type date startTime')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ date: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── MARK NOTIFICATION READ ────────────────────────────────────────────────────
// @route PATCH /api/instructors/notifications/:notifId/read
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notifId,
      { status: 'Read' },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── MARK ALL READ ─────────────────────────────────────────────────────────────
// @route PATCH /api/instructors/:id/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { instructor: req.params.id, status: 'Unread' },
      { status: 'Read' }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── INSTRUCTOR LOGIN ──────────────────────────────────────────────────────────
// @route POST /api/instructors/login
const instructorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const instructor = await Instructor.findOne({ email });
    if (!instructor) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await instructor.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id:      instructor._id,
      fullName: instructor.fullName,
      email:    instructor.email,
      role:     'instructor',
      token:    generateToken(instructor),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createInstructor, getAllInstructors, getInstructorById,
  updateInstructor, deleteInstructor, assignVehicle, removeVehicle,
  getNotifications, markNotificationRead, markAllRead, instructorLogin,
};
