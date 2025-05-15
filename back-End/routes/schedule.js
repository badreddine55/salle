const express = require('express');
const router = express.Router();
const { editSchedule, getSchedules, getScheduleHistory, deleteSchedule } = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

// Routes for schedule management
router.get('/', protect, getSchedules); // GET /api/schedule
router.patch('/', protect, editSchedule); // PATCH /api/schedule
router.get('/history', protect, getScheduleHistory); // GET /api/schedule/history
router.delete('/:id', protect, deleteSchedule); // DELETE /api/schedule/:id

module.exports = router;