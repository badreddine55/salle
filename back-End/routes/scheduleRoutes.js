const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {
  createDraft,
  getDrafts,
  getDraft,
  updateDraft,
  deleteDraft,
  confirmDraft,
  confirmAllDrafts, // New controller function
  createSchedule,
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  exportSchedulePDF,
  exportFormateurPDF,
  getScheduleHistory, 
} = require('../controllers/scheduleController');

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "L'identifiant est invalide." });
  }
  next();
};

// Draft routes
router.post('/drafts', createDraft);
router.get('/drafts', getDrafts);
router.get('/drafts/:id', validateObjectId, getDraft);
router.put('/drafts/:id', validateObjectId, updateDraft);
router.delete('/drafts/:id', validateObjectId, deleteDraft);
router.post('/drafts/:id/confirm', validateObjectId, confirmDraft);
router.post('/drafts/confirm-all', confirmAllDrafts); // New route

// Schedule routes
router.post('/', createSchedule);
router.get('/', getSchedules);
router.get('/history', getScheduleHistory);
router.get('/export/pdf', exportSchedulePDF);
router.get('/:id', validateObjectId, getSchedule);
router.put('/:id', validateObjectId, updateSchedule);
router.delete('/:id', validateObjectId, deleteSchedule);

router.get('/formateurs/:id/pdf', validateObjectId, exportFormateurPDF);

module.exports = router;