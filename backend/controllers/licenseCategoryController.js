const LicenseCategory = require('../models/LicenseCategory');
const VehicleClass = require('../models/VehicleClass');

// @route POST /api/license-categories
const createLicenseCategory = async (req, res) => {
  try {
    const { licenseCategoryName } = req.body;
    if (!licenseCategoryName) {
      return res.status(400).json({ message: 'License category name is required' });
    }

    const exists = await LicenseCategory.findOne({ licenseCategoryName });
    if (exists) return res.status(400).json({ message: 'License category already exists' });

    const category = await LicenseCategory.create({
      licenseCategoryName,
      createdBy: req.user.id,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/license-categories
const getAllLicenseCategories = async (req, res) => {
  try {
    const categories = await LicenseCategory.find()
      .populate('vehicleClasses')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .sort({ createdDate: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/license-categories/:id
const getLicenseCategoryById = async (req, res) => {
  try {
    const category = await LicenseCategory.findById(req.params.id)
      .populate('vehicleClasses')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name');
    if (!category) return res.status(404).json({ message: 'License category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/license-categories/:id
const updateLicenseCategory = async (req, res) => {
  try {
    const category = await LicenseCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'License category not found' });

    category.licenseCategoryName = req.body.licenseCategoryName || category.licenseCategoryName;
    category.modifiedBy = req.user.id;
    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/license-categories/:id
const deleteLicenseCategory = async (req, res) => {
  try {
    const category = await LicenseCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'License category not found' });

    // Check if vehicle classes exist under this category
    const hasClasses = await VehicleClass.findOne({ licenseCategory: req.params.id });
    if (hasClasses) {
      return res.status(400).json({
        message: 'Cannot delete — vehicle classes exist under this category. Delete them first.',
      });
    }

    await category.deleteOne();
    res.json({ message: 'License category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createLicenseCategory, getAllLicenseCategories,
  getLicenseCategoryById, updateLicenseCategory, deleteLicenseCategory,
};
