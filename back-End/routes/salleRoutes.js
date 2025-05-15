const express = require('express');
const router = express.Router();
const {
  getSalles,
  getSalle,
  createSalle,
  updateSalle,
  deleteSalle
} = require('../controllers/salleController');

// Routes pour les salles
router
  .route('/')
  .get(getSalles)
  .post(createSalle);

router
  .route('/:id')
  .get(getSalle)
  .put(updateSalle)
  .delete(deleteSalle);

module.exports = router;