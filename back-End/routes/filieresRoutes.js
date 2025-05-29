const express = require('express');
const router = express.Router();
const { createFiliere, getFilieres, getFiliere, updateFiliere, deleteFiliere } = require('../controllers/filiereController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.route('/')
  .get(getFilieres)
  .post(createFiliere);

router.route('/:id')
  .get(getFiliere)
  .put(updateFiliere)
  .delete(deleteFiliere);

module.exports = router;