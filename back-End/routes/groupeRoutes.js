const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createGroupe, getGroupes, getGroupe, updateGroupe, deleteGroupe } = require('../controllers/groupeController');

router.use(protect);
router.use(restrictTo('superadmin'));

router.route('/')
  .get(getGroupes)
  .post(createGroupe);

router.route('/:id')
  .get(getGroupe)
  .put(updateGroupe)
  .delete(deleteGroupe);

module.exports = router;