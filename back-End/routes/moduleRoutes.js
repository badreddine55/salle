const express = require('express');
const router = express.Router();
const {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
} = require('../controllers/moduleController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes for modules
router
  .route('/')
  .get(getModules) // Accessible to authenticated users
  .post(restrictTo('Superadmin'), createModule); // Restricted to Superadmin

router
  .route('/:id')
  .get(getModule) // Accessible to authenticated users
  .put(restrictTo('Superadmin'), updateModule) // Restricted to Superadmin
  .delete(restrictTo('Superadmin'), deleteModule); // Restricted to Superadmin

module.exports = router;