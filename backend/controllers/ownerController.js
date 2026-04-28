const Owner = require('../models/Owner');

// @route POST /api/owners
const createOwner = async (req, res) => {
  try {
    const { NIC, name, address, email, contactNumber } = req.body;
    if (!NIC || !name || !email || !contactNumber) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const exists = await Owner.findOne({ $or: [{ email }, { NIC }] });
    if (exists) return res.status(400).json({ message: 'Owner already exists' });

    const owner = await Owner.create({
      NIC, name, address, email, contactNumber,
      registeredBy: req.user.id,
    });
    res.status(201).json(owner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/owners
const getAllOwners = async (req, res) => {
  try {
    const owners = await Owner.find()
      .populate('vehicles', 'licensePlate brand model')
      .sort({ createdAt: -1 });
    res.json(owners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/owners/:id
const getOwnerById = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id)
      .populate('vehicles');
    if (!owner) return res.status(404).json({ message: 'Owner not found' });
    res.json(owner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/owners/:id
const updateOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });

    ['name', 'address', 'email', 'contactNumber'].forEach(f => {
      if (req.body[f] !== undefined) owner[f] = req.body[f];
    });
    owner.modifiedBy = req.user.id;
    const updated = await owner.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/owners/:id
const deleteOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });
    await owner.deleteOne();
    res.json({ message: 'Owner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOwner, getAllOwners, getOwnerById, updateOwner, deleteOwner };
