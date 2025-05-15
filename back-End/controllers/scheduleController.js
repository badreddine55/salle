const Schedule = require('../models/Schedule');
const ScheduleHistory = require('../models/ScheduleHistory');
const Formateur = require('../models/Formateur');
const Salle = require('../models/Salle');
const asyncHandler = require('express-async-handler');

// @desc    Create a new schedule entry
// @route   PATCH /api/schedule
// @access  Private (Superadmin)
const editSchedule  = asyncHandler(async (req, res) => {
  const { dayId, slotId, trainerName, roomName } = req.body;

  // Validate inputs
  if (!dayId || !slotId || !trainerName || !roomName) {
    res.status(400);
    throw new Error('Tous les champs sont requis : dayId, slotId, trainerName, roomName');
  }

  if (![1, 2, 3, 4, 5, 6].includes(dayId)) {
    res.status(400);
    throw new Error('dayId doit être entre 1 et 6');
  }

  if (![1, 2, 3, 4].includes(slotId)) {
    res.status(400);
    throw new Error('slotId doit être entre 1 et 4');
  }

  // Find Formateur by name
  const formateur = await Formateur.findOne({ name: trainerName, role: 'Formateur' });
  if (!formateur) {
    res.status(404);
    throw new Error(`Formateur ${trainerName} non trouvé ou n'est pas un formateur`);
  }

  // Find Salle by name
  const salle = await Salle.findOne({ name: roomName });
  if (!salle) {
    res.status(404);
    throw new Error(`Salle ${roomName} non trouvée`);
  }

  // Check constraints
  const existingSchedules = await Schedule.find({ dayId, slotId }).populate([
    { path: 'formateur', select: 'name' },
    { path: 'salle', select: 'name' },
  ]);

  // Constraint 1: Same Formateur and Salle in the same slot
  const duplicateAssignment = existingSchedules.find(
    (s) => s.formateur.name === trainerName && s.salle.name === roomName
  );
  if (duplicateAssignment) {
    res.status(400);
    throw new Error('Formateur et Salle déjà assignés dans ce créneau');
  }

  // Constraint 2: Same Formateur in different Salle in the same slot
  const formateurConflict = existingSchedules.find(
    (s) => s.formateur.name === trainerName && s.salle.name !== roomName
  );
  if (formateurConflict) {
    res.status(400);
    throw new Error(`Formateur déjà assigné à la salle "${formateurConflict.salle.name}" dans ce créneau`);
  }

  // Constraint 3: Same Salle in the same slot
  const salleConflict = existingSchedules.find(
    (s) => s.salle.name === roomName
  );
  if (salleConflict) {
    res.status(400);
    throw new Error('Cette salle est déjà assignée à ce créneau');
  }

  // Save current Schedule collection to history
  const currentSchedules = await Schedule.find();
  await ScheduleHistory.create({
    schedules: currentSchedules.map((s) => ({
      dayId: s.dayId,
      slotId: s.slotId,
      formateur: s.formateur,
      salle: s.salle,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    changeDate: new Date(),
  });

  // Create new schedule entry
  const schedule = await Schedule.create({
    dayId,
    slotId,
    formateur: formateur._id,
    salle: salle._id,
  });

  // Populate formateur and salle for response
  await schedule.populate([
    { path: 'formateur', select: 'name' },
    { path: 'salle', select: 'name' },
  ]);

  res.status(201).json({
    success: true,
    data: {
      _id: schedule._id,
      dayId: schedule.dayId,
      slotId: schedule.slotId,
      formateur: schedule.formateur.name,
      salle: schedule.salle.name,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    },
  });
});

// @desc    Get all schedule entries
// @route   GET /api/schedule
// @access  Private (Superadmin)
const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.find().populate([
    { path: 'formateur', select: 'name' },
    { path: 'salle', select: 'name' },
  ]);

  res.status(200).json({
    success: true,
    data: schedules.map((s) => ({
      _id: s._id,
      dayId: s.dayId,
      slotId: s.slotId,
      formateur: s.formateur.name,
      salle: s.salle.name,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  });
});

// @desc    Get schedule history
// @route   GET /api/schedule/history
// @access  Private (Superadmin)
const getScheduleHistory = asyncHandler(async (req, res) => {
  const history = await ScheduleHistory.find().populate([
    { path: 'schedules.formateur', select: 'name' },
    { path: 'schedules.salle', select: 'name' },
  ]).sort({ changeDate: -1 });

  res.status(200).json({
    success: true,
    data: history.map((h) => ({
      _id: h._id,
      changeDate: h.changeDate,
      schedules: h.schedules.map((s) => ({
        dayId: s.dayId,
        slotId: s.slotId,
        formateur: s.formateur.name,
        salle: s.salle.name,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    })),
  });
});

// @desc    Delete a schedule entry
// @route   DELETE /api/schedule/:id
// @access  Private (Superadmin)
const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) {
    res.status(404);
    throw new Error('Entrée de planification non trouvée');
  }

  // Save current Schedule collection to history
  const currentSchedules = await Schedule.find();
  await ScheduleHistory.create({
    schedules: currentSchedules.map((s) => ({
      dayId: s.dayId,
      slotId: s.slotId,
      formateur: s.formateur,
      salle: s.salle,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    changeDate: new Date(),
  });

  await schedule.deleteOne();

  res.status(200).json({
    success: true,
    data: { _id: req.params.id },
  });
});

module.exports = { editSchedule, getSchedules, getScheduleHistory, deleteSchedule };