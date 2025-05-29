const express = require('express');
const router = express.Router();
const {
  getSalles,
  getSalle,
  createSalle,
  updateSalle,
  deleteSalle,
} = require('../controllers/salleController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes for salles
router
  .route('/')
  .get(getSalles) // Accessible to authenticated users
  .post(restrictTo('Superadmin'), createSalle); // Restricted to Superadmin

router
  .route('/:id')
  .get(getSalle) // Accessible to authenticated users
  .put(restrictTo('Superadmin'), updateSalle) // Restricted to Superadmin
  .delete(restrictTo('Superadmin'), deleteSalle); // Restricted to Superadmin

module.exports = router;