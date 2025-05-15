const express = require('express');
const router = express.Router();
const {
  createFormateur,
  getAllFormateurs,
  getFormateurById,
  updateFormateur,
  deleteFormateur,
} = require('../controllers/formateurController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes and restrict to Superadmin role
router.use(protect, restrictTo('Superadmin'));

// CRUD operations for Formateur and Superadmin management
router.post('/', createFormateur);
router.get('/', getAllFormateurs);
router.get('/:id', getFormateurById);
router.put('/:id', updateFormateur);
router.delete('/:id', deleteFormateur);

module.exports = router;