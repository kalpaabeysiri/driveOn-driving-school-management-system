const Inquiry = require('../models/Inquiry');
const Student = require('../models/Student');

// @route GET /api/inquiries  (admin: all | student: own)
const getInquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (req.user.role === 'student') filter.student = req.user.id;

    const skip = (page - 1) * limit;
    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .populate('student', 'firstName lastName NIC')
        .populate('repliedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Inquiry.countDocuments(filter),
    ]);

    res.json({ inquiries, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/inquiries  (student only)
const createInquiry = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit inquiries' });
    }
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const inquiry = await Inquiry.create({
      student: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      message: message.trim(),
    });

    res.status(201).json({ message: 'Inquiry submitted', inquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/inquiries/:id  (student: edit own Open inquiry)
const updateInquiry = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can edit inquiries' });
    }
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    if (inquiry.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (inquiry.status !== 'Open') {
      return res.status(400).json({ message: 'Only Open inquiries can be edited' });
    }

    inquiry.message = message.trim();
    await inquiry.save();
    res.json({ message: 'Inquiry updated', inquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/inquiries/:id  (student: delete own Open inquiry)
const deleteInquiry = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can delete their inquiries' });
    }
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    if (inquiry.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (inquiry.status !== 'Open') {
      return res.status(400).json({ message: 'Only Open inquiries can be deleted' });
    }

    await inquiry.deleteOne();
    res.json({ message: 'Inquiry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/inquiries/:id/reply  (admin)
const replyToInquiry = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ message: 'Reply is required' });

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      {
        reply: reply.trim(),
        repliedBy: req.user.id,
        repliedAt: new Date(),
        status: 'Replied',
      },
      { new: true }
    ).populate('student', 'firstName lastName');

    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    res.json({ message: 'Reply sent', inquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/inquiries/:id/close  (admin)
const closeInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: 'Closed' },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ message: 'Inquiry closed', inquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/inquiries/stats  (admin)
const getInquiryStats = async (req, res) => {
  try {
    const [open, replied, closed] = await Promise.all([
      Inquiry.countDocuments({ status: 'Open' }),
      Inquiry.countDocuments({ status: 'Replied' }),
      Inquiry.countDocuments({ status: 'Closed' }),
    ]);
    res.json({ open, replied, closed, total: open + replied + closed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getInquiries, createInquiry, updateInquiry, deleteInquiry, replyToInquiry, closeInquiry, getInquiryStats };
