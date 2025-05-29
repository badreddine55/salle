const express = require('express');
const router = express.Router();
const {
  getEtablissements,
  getEtablissement,
  createEtablissement,
  updateEtablissement,
  deleteEtablissement,
} = require('../controllers/etablissementController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Routes for etablissements
router
  .route('/')
  .get(getEtablissements)
  .post(restrictTo('Superadmin'), createEtablissement);

router
  .route('/:id')
  .get(getEtablissement)
  .put(restrictTo('Superadmin'), updateEtablissement)
  .delete(restrictTo('Superadmin'), deleteEtablissement);

module.exports = router;