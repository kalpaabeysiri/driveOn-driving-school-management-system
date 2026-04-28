const Vehicle              = require('../models/Vehicle');
const VehicleUsage         = require('../models/VehicleUsage');
const InsuranceMaintenance = require('../models/InsuranceMaintenance');
const Owner                = require('../models/Owner');
const Notification         = require('../models/Notification');
const Instructor           = require('../models/Instructor');

// ── CREATE VEHICLE ────────────────────────────────────────────────────────────
// @route POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const {
      licensePlate, brand, model, year,
      vehicleType, transmission, fuelType, owner,
    } = req.body;

    if (!licensePlate || !brand || !model || !year || !vehicleType || !transmission || !fuelType) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const exists = await Vehicle.findOne({ licensePlate: licensePlate.toUpperCase() });
    if (exists) return res.status(400).json({ message: 'Vehicle with this license plate already exists' });

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const vehicle = await Vehicle.create({
      licensePlate, brand, model, year,
      vehicleType, transmission, fuelType,
      owner: owner || undefined,
      image,
      registeredBy: req.user.id,
    });

    // Add vehicle to owner's list
    if (owner) {
      await Owner.findByIdAndUpdate(owner, { $push: { vehicles: vehicle._id } });
    }

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET ALL VEHICLES ──────────────────────────────────────────────────────────
// @route GET /api/vehicles
const getAllVehicles = async (req, res) => {
  try {
    const { available, vehicleType, transmission, search } = req.query;
    const filter = {};

    if (available !== undefined) filter.available = available === 'true';
    if (vehicleType)   filter.vehicleType   = vehicleType;
    if (transmission)  filter.transmission  = transmission;
    if (search) filter.$or = [
      { licensePlate: { $regex: search, $options: 'i' } },
      { brand:        { $regex: search, $options: 'i' } },
      { model:        { $regex: search, $options: 'i' } },
    ];

    const vehicles = await Vehicle.find(filter)
      .populate('owner',        'name contactNumber')
      .populate('registeredBy', 'name')
      .populate('modifiedBy',   'name')
      .populate('insuranceDetails')
      .sort({ createdAt: -1 });

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET VEHICLE BY ID ─────────────────────────────────────────────────────────
// @route GET /api/vehicles/:id
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner',            'name NIC contactNumber email address')
      .populate('registeredBy',     'name email')
      .populate('modifiedBy',       'name email')
      .populate('insuranceDetails')
      .populate({ path: 'sessions', populate: { path: 'instructor', select: 'fullName' } });

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE VEHICLE ────────────────────────────────────────────────────────────
// @route PUT /api/vehicles/:id
// @route PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Check if new license plate already exists on another vehicle
    if (req.body.licensePlate && req.body.licensePlate !== vehicle.licensePlate) {
      const exists = await Vehicle.findOne({
        licensePlate: req.body.licensePlate.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (exists) {
        return res.status(400).json({ message: 'A vehicle with this license plate already exists' });
      }
    }

    const allowedFields = [
      'licensePlate', 'brand', 'model', 'year', 'vehicleType',
      'transmission', 'fuelType', 'available', 'usageStatus',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) vehicle[field] = req.body[field];
    });

    if (req.file) vehicle.image = `/uploads/${req.file.filename}`;
    vehicle.modifiedBy = req.user.id;

    const updated = await vehicle.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE VEHICLE ────────────────────────────────────────────────────────────
// @route DELETE /api/vehicles/:id
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Remove from owner
    if (vehicle.owner) {
      await Owner.findByIdAndUpdate(vehicle.owner, { $pull: { vehicles: vehicle._id } });
    }
    // Delete related insurance and usage records
    await InsuranceMaintenance.deleteMany({ vehicle: vehicle._id });
    await VehicleUsage.deleteMany({ vehicle: vehicle._id });

    await vehicle.deleteOne();
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE AVAILABILITY STATUS ────────────────────────────────────────────────
// @route PATCH /api/vehicles/:id/status
const updateVehicleStatus = async (req, res) => {
  try {
    const { usageStatus, available } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { usageStatus, available, modifiedBy: req.user.id },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── INSURANCE & MAINTENANCE CRUD ──────────────────────────────────────────────
// @route POST /api/vehicles/:id/insurance
const addInsurance = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Remove old insurance record if exists
    if (vehicle.insuranceDetails) {
      await InsuranceMaintenance.findByIdAndDelete(vehicle.insuranceDetails);
    }

    const insurance = await InsuranceMaintenance.create({
      vehicle:                req.params.id,
      insuranceProvider:      req.body.insuranceProvider,
      policyNumber:           req.body.policyNumber,
      insuranceExpiryDate:    req.body.insuranceExpiryDate,
      emissionTestExpiryDate: req.body.emissionTestExpiryDate,
      lastMaintenanceDate:    req.body.lastMaintenanceDate,
      nextMaintenanceDate:    req.body.nextMaintenanceDate,
      maintenanceNotes:       req.body.maintenanceNotes,
      registeredBy:           req.user.id,
    });

    vehicle.insuranceDetails = insurance._id;
    await vehicle.save();

    // Send expiry alerts if expiring within 30 days
    await checkAndSendExpiryAlerts(vehicle, insurance);

    res.status(201).json(insurance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/vehicles/:id/insurance
const updateInsurance = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle || !vehicle.insuranceDetails) {
      return res.status(404).json({ message: 'Insurance record not found' });
    }

    const insurance = await InsuranceMaintenance.findByIdAndUpdate(
      vehicle.insuranceDetails,
      { ...req.body, modifiedBy: req.user.id },
      { new: true }
    );

    await checkAndSendExpiryAlerts(vehicle, insurance);
    res.json(insurance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── VEHICLE USAGE ─────────────────────────────────────────────────────────────
// @route POST /api/vehicles/:id/usage
const addUsage = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const usage = await VehicleUsage.create({
      vehicle:      req.params.id,
      licensePlate: vehicle.licensePlate,
      vehicleModel: `${vehicle.brand} ${vehicle.model}`,
      km:           req.body.km,
      duration:     req.body.duration,
      date:         req.body.date || new Date(),
      session:      req.body.session,
      notes:        req.body.notes,
      recordedBy:   req.user.id,
    });

    res.status(201).json(usage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── USAGE REPORT ──────────────────────────────────────────────────────────────
// @route GET /api/vehicles/report/usage
const usageReport = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;
    const filter = {};

    if (vehicleId) filter.vehicle = vehicleId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }

    const usageRecords = await VehicleUsage.find(filter)
      .populate('vehicle',  'brand model licensePlate vehicleType')
      .populate('session',  'type date')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    // Summary per vehicle
    const summary = await VehicleUsage.aggregate([
      { $match: filter },
      {
        $group: {
          _id:          '$vehicle',
          totalKm:      { $sum: '$km' },
          totalDuration:{ $sum: '$duration' },
          totalTrips:   { $sum: 1 },
          licensePlate: { $first: '$licensePlate' },
          vehicleModel: { $first: '$vehicleModel' },
        },
      },
      { $sort: { totalKm: -1 } },
    ]);

    res.json({ usageRecords, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── EXPIRY ALERTS ─────────────────────────────────────────────────────────────
// @route GET /api/vehicles/alerts/expiry
const expiryAlerts = async (req, res) => {
  try {
    const today     = new Date();
    const in30Days  = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const alerts = await InsuranceMaintenance.find({
      $or: [
        { insuranceExpiryDate:    { $lte: in30Days } },
        { emissionTestExpiryDate: { $lte: in30Days } },
        { nextMaintenanceDate:    { $lte: in30Days } },
      ],
    }).populate('vehicle', 'brand model licensePlate');

    const formatted = alerts.map(a => {
      const issues = [];
      const diffDays = (date) => Math.ceil((date - today) / (1000 * 60 * 60 * 24));

      if (a.insuranceExpiryDate <= in30Days) {
        const days = diffDays(a.insuranceExpiryDate);
        issues.push({
          type:    'Insurance',
          message: days <= 0 ? 'Insurance EXPIRED' : `Insurance expires in ${days} days`,
          urgent:  days <= 7,
          date:    a.insuranceExpiryDate,
        });
      }
      if (a.emissionTestExpiryDate <= in30Days) {
        const days = diffDays(a.emissionTestExpiryDate);
        issues.push({
          type:    'Emission Test',
          message: days <= 0 ? 'Emission test EXPIRED' : `Emission test expires in ${days} days`,
          urgent:  days <= 7,
          date:    a.emissionTestExpiryDate,
        });
      }
      if (a.nextMaintenanceDate && a.nextMaintenanceDate <= in30Days) {
        const days = diffDays(a.nextMaintenanceDate);
        issues.push({
          type:    'Maintenance',
          message: days <= 0 ? 'Maintenance overdue' : `Maintenance due in ${days} days`,
          urgent:  days <= 7,
          date:    a.nextMaintenanceDate,
        });
      }

      return {
        vehicle: a.vehicle,
        issues,
      };
    });

    res.json(formatted.filter(a => a.issues.length > 0));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── HELPER: Send expiry notifications to instructors ─────────────────────────
async function checkAndSendExpiryAlerts(vehicle, insurance) {
  try {
    const today    = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find instructors assigned to this vehicle
    const instructors = await Instructor.find({
      assignedVehicles: vehicle._id,
    });

    for (const instructor of instructors) {
      if (insurance.insuranceExpiryDate <= in30Days) {
        const notif = await Notification.create({
          instructor: instructor._id,
          vehicle:    vehicle._id,
          type:       'InsuranceExpiry',
          message:    `Insurance for ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) expires on ${insurance.insuranceExpiryDate.toDateString()}`,
          status:     'Unread',
        });
        instructor.notifications.push(notif._id);
        await instructor.save();
      }

      if (insurance.emissionTestExpiryDate <= in30Days) {
        const notif = await Notification.create({
          instructor: instructor._id,
          vehicle:    vehicle._id,
          type:       'InsuranceExpiry',
          message:    `Emission test for ${vehicle.brand} ${vehicle.model} expires on ${insurance.emissionTestExpiryDate.toDateString()}`,
          status:     'Unread',
        });
        instructor.notifications.push(notif._id);
        await instructor.save();
      }
    }
  } catch (err) {
    console.log('Alert error:', err.message);
  }
}

module.exports = {
  createVehicle, getAllVehicles, getVehicleById,
  updateVehicle, deleteVehicle, updateVehicleStatus,
  addInsurance, updateInsurance,
  addUsage, usageReport, expiryAlerts,
};
