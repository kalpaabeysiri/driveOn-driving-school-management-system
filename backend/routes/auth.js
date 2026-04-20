const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);  // Keep this as is for now
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Test route for debugging
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working', timestamp: new Date() });
});

module.exports = router;
