const express = require('express');
const router = express.Router();
const {
  getFormateurs,
  getFormateurById,
  createFormateur,
  updateFormateur,
  deleteFormateur,
} = require('../controllers/formateurController');

// Define routes
router.get('/', getFormateurs); // Get all formateurs
router.get('/:id', getFormateurById); // Get a single formateur by ID
router.post('/', createFormateur); // Create a new formateur
router.put('/:id', updateFormateur); // Update a formateur
router.delete('/:id', deleteFormateur); // Delete a formateur

module.exports = router;