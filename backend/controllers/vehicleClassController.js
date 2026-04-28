const VehicleClass = require('../models/VehicleClass');
const LicenseCategory = require('../models/LicenseCategory');

// @route POST /api/vehicle-classes
const createVehicleClass = async (req, res) => {
  try {
    const { vehicleClassName, vehicleClassFee, licenseCategory } = req.body;

    if (!vehicleClassName || !vehicleClassFee || !licenseCategory) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const category = await LicenseCategory.findById(licenseCategory);
    if (!category) return res.status(404).json({ message: 'License category not found' });

    const vehicleClass = await VehicleClass.create({
      vehicleClassName,
      vehicleClassFee,
      licenseCategory,
      createdBy: req.user.id,
    });

    // Add vehicle class to license category's list
    category.vehicleClasses.push(vehicleClass._id);
    await category.save();

    res.status(201).json(vehicleClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/vehicle-classes
const getAllVehicleClasses = async (req, res) => {
  try {
    const { licenseCategory } = req.query;
    const filter = licenseCategory ? { licenseCategory } : {};

    const classes = await VehicleClass.find(filter)
      .populate('licenseCategory', 'licenseCategoryName')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .sort({ createdDate: -1 });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/vehicle-classes/:id
const getVehicleClassById = async (req, res) => {
  try {
    const vehicleClass = await VehicleClass.findById(req.params.id)
      .populate('licenseCategory', 'licenseCategoryName')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name');

    if (!vehicleClass) return res.status(404).json({ message: 'Vehicle class not found' });
    res.json(vehicleClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/vehicle-classes/:id
const updateVehicleClass = async (req, res) => {
  try {
    const vehicleClass = await VehicleClass.findById(req.params.id);
    if (!vehicleClass) return res.status(404).json({ message: 'Vehicle class not found' });

    vehicleClass.vehicleClassName = req.body.vehicleClassName || vehicleClass.vehicleClassName;
    vehicleClass.vehicleClassFee  = req.body.vehicleClassFee  || vehicleClass.vehicleClassFee;
    vehicleClass.modifiedBy       = req.user.id;

    const updated = await vehicleClass.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/vehicle-classes/:id
const deleteVehicleClass = async (req, res) => {
  try {
    const vehicleClass = await VehicleClass.findById(req.params.id);
    if (!vehicleClass) return res.status(404).json({ message: 'Vehicle class not found' });

    // Remove from license category list
    await LicenseCategory.findByIdAndUpdate(
      vehicleClass.licenseCategory,
      { $pull: { vehicleClasses: vehicleClass._id } }
    );

    await vehicleClass.deleteOne();
    res.json({ message: 'Vehicle class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVehicleClass, getAllVehicleClasses,
  getVehicleClassById, updateVehicleClass, deleteVehicleClass,
};
