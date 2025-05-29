const express = require('express');
const router = express.Router();
const {
  login,
  forgetPassword,
  resetPassword,
  getMe,
  updateMe,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/forget-password', forgetPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);

module.exports = router;