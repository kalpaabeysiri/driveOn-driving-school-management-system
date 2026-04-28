const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const materialUpload = require('../middleware/materialUpload');
const {
  createStudyMaterial,
  getStudyMaterials,
  getStudyMaterialById,
  updateStudyMaterial,
  deleteStudyMaterial,
} = require('../controllers/studyMaterialController');

router.get('/', protect, getStudyMaterials);
router.get('/:id', protect, getStudyMaterialById);
router.post('/', protect, adminOnly, materialUpload.single('file'), createStudyMaterial);
router.put('/:id', protect, adminOnly, materialUpload.single('file'), updateStudyMaterial);
router.delete('/:id', protect, adminOnly, deleteStudyMaterial);

module.exports = router;
