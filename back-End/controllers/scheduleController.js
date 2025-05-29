const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Schedule = require('../models/Schedule');
const Draft = require('../models/Draft');
const ScheduleHistory = require('../models/ScheduleHistory');
const Formateur = require('../models/Formateur');
const Etablissement = require('../models/Etablissement');
const Filiere = require('../models/Filiere');
const PDFDocument = require('pdfkit');
const { transformSchedules } = require('../utils/transformSchedules');
const fs = require('fs');
const path = require('path');
const { ObjectId } = mongoose.Types;
const isValidObjectId = (id) => {
  if (!id) return false;
  return ObjectId.isValid(id) && String(new ObjectId(id)) === String(id);
};

// Create a new draft (unchanged)
const createDraft = asyncHandler(async (req, res) => {
  const { trainerName, salleName, groupName, filiereId, dayId, slotId, moduleName } = req.body;

  console.log('createDraft input:', { trainerName, salleName, groupName, filiereId, dayId, slotId, moduleName });

  if (!trainerName || !salleName || !groupName || !filiereId || !dayId || !slotId) {
    res.status(400);
    throw new Error('Tous les champs (trainerName, salleName, groupName, filiereId, dayId, slotId) sont requis');
  }

  if (![1, 2, 3, 4, 5, 6].includes(Number(dayId))) {
    res.status(400);
    throw new Error('dayId doit être entre 1 et 6');
  }
  if (![1, 2, 3, 4].includes(Number(slotId))) {
    res.status(400);
    throw new Error('slotId doit être entre 1 et 4');
  }

  const formateur = await Formateur.findOne({ name: trainerName });
  if (!formateur) {
    res.status(404);
    throw new Error(`Formateur "${trainerName}" non trouvé.`);
  }

  const etablissement = await Etablissement.findOne({ salles: salleName });
  if (!etablissement) {
    res.status(404);
    throw new Error(`Salle "${salleName}" non trouvée dans aucun établissement.`);
  }

  if (!mongoose.Types.ObjectId.isValid(filiereId)) {
    console.error('Invalid filiere ID:', filiereId);
    res.status(400);
    throw new Error('L\'identifiant de la filière est invalide.');
  }
  const filiere = await Filiere.findById(filiereId);
  if (!filiere) {
    res.status(404);
    throw new Error('Filière non trouvée avec cet ID.');
  }

  const groupExists = filiere.groups.some(group => group.name === groupName);
  if (!groupExists) {
    res.status(404);
    throw new Error(`Groupe "${groupName}" non trouvé dans la filière.`);
  }

  let moduleData = null;
  if (moduleName) {
    const moduleExists = filiere.modules.some(module => module.name === moduleName);
    if (!moduleExists) {
      res.status(404);
      throw new Error(`Module "${moduleName}" non trouvé dans la filière.`);
    }
    moduleData = { name: moduleName, formateur: formateur._id };
  }

  const existingDraftOrSchedule = await Promise.all([
    Draft.findOne({
      $or: [
        { formateur, dayId, slotId },
        { salle: salleName, dayId, slotId },
        { 'groupe.name': groupName, dayId, slotId },
      ],
    }),
    Schedule.findOne({
      $or: [
        { formateur, dayId, slotId },
        { salle: salleName, dayId, slotId },
        { 'groupe.name': groupName, dayId, slotId },
      ],
    }),
  ]);

  if (existingDraftOrSchedule[0] || existingDraftOrSchedule[1]) {
    res.status(400);
    throw new Error('Conflit de planification : le formateur, la salle ou le groupe est déjà occupé à ce créneau');
  }

  const draft = await Draft.create({
    formateur: formateur._id,
    salle: salleName,
    groupe: { name: groupName },
    filiere: filiere._id,
    dayId,
    slotId,
    module: moduleData,
  });

  res.status(201).json({
    success: true,
    data: draft,
  });
});

// Get all drafts (unchanged)
const getDrafts = asyncHandler(async (req, res) => {
  try {
    const drafts = await Draft.find({})
      .populate({
        path: 'formateur',
        select: 'name',
        match: { _id: { $exists: true, $ne: null } },
      })
      .populate({
        path: 'filiere',
        select: 'name',
        match: { _id: { $exists: true, $ne: null } },
      })
      .populate({
        path: 'module.formateur',
        select: 'name',
        match: { _id: { $exists: true, $ne: null } },
      })
      .lean();

    const transformedDrafts = drafts
      .filter(draft => draft && draft._id && draft.formateur && draft.filiere)
      .map(draft => ({
        id: draft._id.toString(),
        formateur: { _id: draft.formateur._id, name: draft.formateur.name || 'N/A' },
        salle: draft.salle || 'N/A',
        groupe: draft.groupe?.name || 'N/A',
        filiere: { _id: draft.filiere._id, name: draft.filiere.name || 'N/A' },
        jour: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'][draft.dayId - 1] || 'LUNDI',
        slot: draft.slotId,
        module: draft.module?.name ? {
          name: draft.module.name,
          formateur: draft.module.formateur ? { _id: draft.module.formateur._id, name: draft.module.formateur.name || 'N/A' } : null,
        } : null,
      }));

    res.status(200).json({
      success: true,
      data: transformedDrafts,
    });
  } catch (error) {
    console.error('Error in getDrafts:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des brouillons',
      error: error.message,
    });
  }
});

// Get a single draft (updated to remove redundant ID validation)
const getDraft = asyncHandler(async (req, res) => {
  const draft = await Draft.findById(req.params.id)
    .populate('formateur', 'name')
    .populate('filiere', 'name')
    .populate('module.formateur', 'name');

  if (!draft) {
    res.status(404);
    throw new Error('Brouillon non trouvé');
  }

  res.status(200).json({
    success: true,
    data: {
      id: draft._id.toString(),
      formateur: { _id: draft.formateur._id, name: draft.formateur.name || 'N/A' },
      salle: draft.salle || 'N/A',
      groupe: draft.groupe?.name || 'N/A',
      filiere: { _id: draft.filiere._id, name: draft.filiere.name || 'N/A' },
      jour: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'][draft.dayId - 1] || 'LUNDI',
      slot: draft.slotId,
      module: draft.module?.name ? {
        name: draft.module.name,
        formateur: draft.module.formateur ? { _id: draft.module.formateur._id, name: draft.module.formateur.name || 'N/A' } : null,
      } : null,
    },
  });
});

// Update a draft (updated to remove redundant ID validation)
const updateDraft = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dayId, slotId, trainerId, trainerName, salleName, filiereId, groupName, moduleName } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Identifiant de brouillon invalide' });
  }

  if (!isValidObjectId(trainerId) || !isValidObjectId(filiereId)) {
    return res.status(400).json({ success: false, message: 'Identifiant formateur ou filière invalide' });
  }

  if (!dayId || ![1, 2, 3, 4, 5, 6].includes(dayId)) {
    return res.status(400).json({ success: false, message: 'Jour invalide' });
  }

  if (!slotId || ![1, 2, 3, 4].includes(slotId)) {
    return res.status(400).json({ success: false, message: 'Créneau horaire invalide' });
  }

  if (!salleName || !groupName || !moduleName) {
    return res.status(400).json({ success: false, message: 'Champs requis manquants' });
  }

  try {
    // Check for conflicts
    const conflict = await Draft.findOne({
      _id: { $ne: id },
      $or: [
        { formateur: trainerId, dayId, slotId },
        { salle: salleName, dayId, slotId },
        { 'groupe.name': groupName, dayId, slotId },
      ],
    }).lean();

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'Conflit détecté : formateur, salle ou groupe déjà assigné à ce créneau',
      });
    }

    const draft = await Draft.findById(id);
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Brouillon non trouvé' });
    }

    draft.formateur = trainerId;
    draft.salle = salleName;
    draft.groupe = { name: groupName };
    draft.filiere = filiereId;
    draft.dayId = dayId;
    draft.slotId = slotId;
    draft.module = { name: moduleName, formateur: trainerId };

    await draft.save();

    res.status(200).json({
      success: true,
      data: {
        id: draft._id.toString(),
        jour: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'][draft.dayId - 1],
        slot: draft.slotId,
        formateur: { _id: draft.formateur.toString(), name: trainerName },
        salle: draft.salle,
        filiere: { _id: draft.filiere.toString(), name: (await require('../models/Filiere').findById(filiereId))?.name || 'N/A' },
        groupe: draft.groupe.name,
        module: draft.module,
      },
    });
  } catch (error) {
    console.error('Error updating draft:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du brouillon',
      error: error.message,
    });
  }
});

// Delete a draft (updated to remove redundant ID validation)
const deleteDraft = asyncHandler(async (req, res) => {
  console.log('deleteDraft ID:', req.params.id);

  const draft = await Draft.findById(req.params.id);
  if (!draft) {
    res.status(404);
    throw new Error('Brouillon non trouvé');
  }

  await draft.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// Confirm a draft (updated to remove redundant ID validation)
const confirmDraft = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const draft = await Draft.findById(id);
  if (!draft) {
    res.status(404);
    throw new Error('Brouillon non trouvé');
  }

  const existingSchedule = await Schedule.findOne({
    $or: [
      { formateur: draft.formateur, dayId: draft.dayId, slotId: draft.slotId },
      { salle: draft.salle, dayId: draft.dayId, slotId: draft.slotId },
      { 'groupe.name': draft.groupe.name, dayId: draft.dayId, slotId: draft.slotId },
    ],
  });

  if (existingSchedule) {
    res.status(400);
    throw new Error('Conflit de planification : le formateur, la salle ou le groupe est déjà occupé à ce créneau');
  }

  const schedule = await Schedule.create({
    formateur: draft.formateur,
    salle: draft.salle,
    groupe: draft.groupe,
    filiere: draft.filiere,
    dayId: draft.dayId,
    slotId: draft.slotId,
    module: draft.module,
  });

  await ScheduleHistory.create({
    scheduleId: schedule._id,
    formateur: draft.formateur,
    salle: draft.salle,
    groupe: draft.groupe,
    filiere: draft.filiere,
    dayId: draft.dayId,
    slotId: draft.slotId,
    module: draft.module,
    action: 'CREATED',
  });

  await draft.deleteOne();

  res.status(200).json({
    success: true,
    data: schedule,
  });
});

// Create a new schedule (unchanged)
const createSchedule = asyncHandler(async (req, res) => {
  const { trainerName, salleName, groupName, filiereId, dayId, slotId, moduleName } = req.body;

  console.log('createSchedule input:', { trainerName, salleName, groupName, filiereId, dayId, slotId, moduleName });

  if (!trainerName || !salleName || !groupName || !filiereId || !dayId || !slotId) {
    res.status(400);
    throw new Error('Tous les champs (trainerName, salleName, groupName, filiereId, dayId, slotId) sont requis');
  }

  if (![1, 2, 3, 4, 5, 6].includes(Number(dayId))) {
    res.status(400);
    throw new Error('dayId doit être entre 1 et 6');
  }
  if (![1, 2, 3, 4].includes(Number(slotId))) {
    res.status(400);
    throw new Error('slotId doit être entre 1 et 4');
  }

  const formateur = await Formateur.findOne({ name: trainerName });
  if (!formateur) {
    res.status(404);
    throw new Error(`Formateur "${trainerName}" non trouvé.`);
  }

  const etablissement = await Etablissement.findOne({ salles: salleName });
  if (!etablissement) {
    res.status(404);
    throw new Error(`Salle "${salleName}" non trouvée dans aucun établissement.`);
  }

  if (!mongoose.Types.ObjectId.isValid(filiereId)) {
    console.error('Invalid filiere ID:', filiereId);
    res.status(400);
    throw new Error('L\'identifiant de la filière est invalide.');
  }
  const filiere = await Filiere.findById(filiereId);
  if (!filiere) {
    res.status(404);
    throw new Error('Filière non trouvée avec cet ID.');
  }

  const groupExists = filiere.groups.some(group => group.name === groupName);
  if (!groupExists) {
    res.status(404);
    throw new Error(`Groupe "${groupName}" non trouvé dans la filière.`);
  }

  let moduleData = null;
  if (moduleName) {
    const moduleExists = filiere.modules.some(module => module.name === moduleName);
    if (!moduleExists) {
      res.status(404);
      throw new Error(`Module "${moduleName}" non trouvé dans la filière.`);
    }
    moduleData = { name: moduleName, formateur: formateur._id };
  }

  const existingSchedule = await Schedule.findOne({
    $or: [
      { formateur, dayId, slotId },
      { salle: salleName, dayId, slotId },
      { 'groupe.name': groupName, dayId, slotId },
    ],
  });

  if (existingSchedule) {
    res.status(400);
    throw new Error('Conflit de planification : le formateur, la salle ou le groupe est déjà occupé à ce créneau');
  }

  const schedule = await Schedule.create({
    formateur: formateur._id,
    salle: salleName,
    groupe: { name: groupName },
    filiere: filiere._id,
    dayId,
    slotId,
    module: moduleData,
  });

  res.status(201).json({
    success: true,
    data: schedule,
  });
});

// Get all schedules (unchanged)
const getSchedules = asyncHandler(async (req, res) => {
  try {
    const schedules = await Schedule.find({})
      .populate({
        path: 'formateur',
        select: 'name',
        match: { _id: { $exists: true, $ne: null } },
      })
      .populate({
        path: 'filiere',
        select: 'name',
        match: { _id: { $exists: true, $ne: null } },
      })
      .populate({
        path: 'module.formateur',
        select: 'name',
        match: { _id: { $exists: true, $ne: null } },
      })
      .lean();

    const transformedSchedules = schedules
      .filter(schedule => schedule && schedule._id && schedule.formateur && schedule.filiere)
      .map(schedule => ({
        id: schedule._id.toString(),
        formateur: { _id: schedule.formateur._id, name: schedule.formateur.name || 'N/A' },
        salle: schedule.salle || 'N/A',
        groupe: schedule.groupe?.name || 'N/A',
        filiere: { _id: schedule.filiere._id, name: schedule.filiere.name || 'N/A' },
        jour: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'][schedule.dayId - 1] || 'LUNDI',
        slot: schedule.slotId,
        module: schedule.module?.name ? {
          name: schedule.module.name,
          formateur: schedule.module.formateur ? { _id: schedule.module.formateur._id, name: schedule.module.formateur.name || 'N/A' } : null,
        } : null,
      }));

    res.status(200).json({
      success: true,
      data: transformedSchedules,
    });
  } catch (error) {
    console.error('Error in getSchedules:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des plannings',
      error: error.message,
    });
  }
});

// Get a single schedule (updated to remove redundant ID validation)
const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id)
    .populate('formateur', 'name')
    .populate('filiere', 'name')
    .populate('module.formateur', 'name');

  if (!schedule) {
    res.status(404);
    throw new Error('Planification non trouvée');
  }

  res.status(200).json({
    success: true,
    data: {
      id: schedule._id.toString(),
      formateur: { _id: schedule.formateur._id, name: schedule.formateur.name || 'N/A' },
      salle: schedule.salle || 'N/A',
      groupe: schedule.groupe?.name || 'N/A',
      filiere: { _id: schedule.filiere._id, name: schedule.filiere.name || 'N/A' },
      jour: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'][schedule.dayId - 1] || 'LUNDI',
      slot: schedule.slotId,
      module: schedule.module?.name ? {
        name: schedule.module.name,
        formateur: schedule.module.formateur ? { _id: schedule.module.formateur._id, name: schedule.module.formateur.name || 'N/A' } : null,
      } : null,
    },
  });
});

// Update a schedule (updated to remove redundant ID validation)
const updateSchedule = asyncHandler(async (req, res) => {
  const { trainerName, salleName, groupName, filiereId, dayId, slotId, moduleName } = req.body;

  console.log('updateSchedule input:', { id: req.params.id, trainerName, salleName, groupName, filiereId, dayId, slotId, moduleName });

  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) {
    res.status(404);
    throw new Error('Planification non trouvée');
  }

  let formateurId = schedule.formateur;
  if (trainerName) {
    const formateur = await Formateur.findOne({ name: trainerName });
    if (!formateur) {
      res.status(404);
      throw new Error(`Formateur "${trainerName}" non trouvé.`);
    }
    formateurId = formateur._id;
  }

  let salleResolved = schedule.salle;
  if (salleName) {
    const etablissement = await Etablissement.findOne({ salles: salleName });
    if (!etablissement) {
      res.status(404);
      throw new Error(`Salle "${salleName}" non trouvée dans aucun établissement.`);
    }
    salleResolved = salleName;
  }

  let groupResolved = schedule.groupe;
  if (groupName) {
    const filiere = await Filiere.findById(filiereId || schedule.filiere);
    if (!filiere) {
      res.status(404);
      throw new Error('Filière non trouvée.');
    }
    const groupExists = filiere.groups.some(group => group.name === groupName);
    if (!groupExists) {
      res.status(404);
      throw new Error(`Groupe "${groupName}" non trouvé dans la filière.`);
    }
    groupResolved = { name: groupName };
  }

  let filiereIdResolved = schedule.filiere;
  if (filiereId) {
    if (!mongoose.Types.ObjectId.isValid(filiereId)) {
      console.error('Invalid filiere ID:', filiereId);
      res.status(400);
      throw new Error('L\'identifiant de la filière est invalide.');
    }
    const filiere = await Filiere.findById(filiereId);
    if (!filiere) {
      res.status(404);
      throw new Error('Filière non trouvée avec cet ID.');
    }
    filiereIdResolved = filiere._id;
  }

  let moduleResolved = schedule.module;
  if (moduleName) {
    const filiere = await Filiere.findById(filiereId || schedule.filiere);
    const moduleExists = filiere.modules.some(module => module.name === moduleName);
    if (!moduleExists) {
      res.status(404);
      throw new Error(`Module "${moduleName}" non trouvé dans la filière.`);
    }
    moduleResolved = { name: moduleName, formateur: formateurId };
  }

  const existingSchedule = await Schedule.findOne({
    _id: { $ne: req.params.id },
    $or: [
      { formateur: formateurId, dayId: dayId || schedule.dayId, slotId: slotId || schedule.slotId },
      { salle: salleResolved, dayId: dayId || schedule.dayId, slotId: slotId || schedule.slotId },
      { 'groupe.name': groupName || schedule.groupe.name, dayId: dayId || schedule.dayId, slotId: slotId || schedule.slotId },
    ],
  });

  if (existingSchedule) {
    res.status(400);
    throw new Error('Conflit de planification : le formateur, la salle ou le groupe est déjà occupé à ce créneau');
  }

  schedule.formateur = formateurId;
  schedule.salle = salleResolved;
  schedule.groupe = groupResolved;
  schedule.filiere = filiereIdResolved;
  schedule.dayId = dayId || schedule.dayId;
  schedule.slotId = slotId || schedule.slotId;
  schedule.module = moduleResolved;
  await schedule.save();

  res.status(200).json({
    success: true,
    data: schedule,
  });
});

// Delete a schedule (updated to remove redundant ID validation)
const deleteSchedule = asyncHandler(async (req, res) => {
  console.log('deleteSchedule ID:', req.params.id);

  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) {
    res.status(404);
    throw new Error('Planification non trouvée');
  }

  await schedule.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// Export schedules as PDF (unchanged)
const exportSchedulePDF = async (req, res) => {
  const { formateurId } = req.query;

  try {
    if (formateurId && !mongoose.Types.ObjectId.isValid(formateurId)) {
      return res.status(400).json({ message: "L'identifiant du formateur est invalide." });
    }

    let formateur = null;
    if (formateurId) {
      formateur = await Formateur.findById(formateurId).select('name email phoneNumber address role');
      if (!formateur) {
        return res.status(404).json({ message: "Formateur non trouvé." });
      }
    }

    const timeSlots = [
      { id: 1, start: "8:30", end: "11:00" },
      { id: 2, start: "11:00", end: "13:30" },
      { id: 3, start: "13:30", end: "16:00" },
      { id: 4, start: "16:00", end: "18:30" },
    ];

    function calculateDuration(startTime, endTime) {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);

      let durationMinutes = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }

      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }

    function calculateTotalHours(durations) {
      let totalMinutes = 0;

      durations.forEach((duration) => {
        const [hours, minutes] = duration.split(":").map(Number);
        totalMinutes += hours * 60 + minutes;
      });

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }

    const query = formateurId ? { formateur: formateurId } : {};
    const scheduleData = await Schedule.find(query)
      .populate('formateur', 'name')
      .lean();

    const etablissements = await Etablissement.find().lean();
    const salleToEFP = {};
    etablissements.forEach((etab) => {
      etab.salles.forEach((salle) => {
        salleToEFP[salle] = etab.name;
      });
    });

    const transformedSchedule = scheduleData.map(schedule => ({
      efp: salleToEFP[schedule.salle] || "N/A",
      groupe: schedule.groupe?.name || "N/A",
      jour: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'][schedule.dayId - 1] || 'LUNDI',
      debut: timeSlots[schedule.slotId - 1]?.start || "8:30",
      fin: timeSlots[schedule.slotId - 1]?.end || "11:00",
      salle: schedule.salle || "N/A",
      formateur: schedule.formateur?.name || "N/A",
      duree: calculateDuration(
        timeSlots[schedule.slotId - 1]?.start || "8:30",
        timeSlots[schedule.slotId - 1]?.end || "11:00"
      ),
    }));

    if (transformedSchedule.length === 0) {
      return res.status(404).json({ message: formateurId ? "Aucun planning trouvé pour ce formateur." : "Aucun planning trouvé." });
    }

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 30, bottom: 30, left: 30, right: 30 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="emploi-du-temps${formateurId ? `-formateur-${formateurId}` : ""}-${Date.now()}.pdf"`);
    doc.pipe(res);

    const drawCell = (x, y, width, height, text, options = {}) => {
      const defaultOptions = {
        align: "center",
        fontSize: 12,
        bold: false,
        background: false,
        border: true,
      };
      const opts = { ...defaultOptions, ...options };

      if (opts.background) {
        doc.fillColor(opts.background).rect(x, y, width, height).fill();
      }
      if (opts.border) {
        doc.strokeColor("#000000").lineWidth(0.5).rect(x, y, width, height).stroke();
      }
      if (text) {
        doc.fillColor("#000000");
        doc.fontSize(opts.fontSize);
        doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica");

        const textHeight = doc.currentLineHeight();
        const textY = y + (height - textHeight) / 2;

        if (opts.align === "center") {
          doc.text(text, x, textY, { width, align: "center" });
        } else if (opts.align === "left") {
          doc.text(text, x + 5, textY, { width: width - 10, align: "left" });
        }
      }
    };

    const totalWidth = 782;
    const colWidths = [
      totalWidth * (1 / 12),
      totalWidth * (1 / 12),
      totalWidth * (2 / 12),
      totalWidth * (1 / 12),
      totalWidth * (1 / 12),
      totalWidth * (1 / 12),
      totalWidth * (3 / 12),
      totalWidth * (2 / 12),
    ];

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    const currentDate = new Date().toLocaleDateString("fr-FR");

    let y = 30;
    drawCell(30, y, colWidths[0] * 3, 40, "OFPPT", { bold: true, fontSize: 14 });
    drawCell(30 + colWidths[0] * 3, y, colWidths[1] * 5, 40, "EMPLOI DU TEMPS", { bold: true, fontSize: 14 });
    drawCell(30 + colWidths[0] * 8, y, colWidths[2] * 1, 40, "CFPB", { bold: true, fontSize: 14 });
    drawCell(30 + colWidths[0] * 10, y, colWidths[3] * 1, 40, `ANNEE\n${academicYear}`, { fontSize: 9 });
    drawCell(30 + colWidths[0] * 11, y, colWidths[4], 40, "en cours", { fontSize: 8 });

    y += 40;
    drawCell(30, y, colWidths[0] * 3, 40, "FORMATEUR", { bold: true });
    drawCell(30 + colWidths[0] * 3, y, colWidths[1] * 9, 40, formateur ? formateur.name.toUpperCase() : "TOUS LES FORMATEURS", { bold: true, fontSize: 20 });

    y += 40;
    drawCell(30, y, colWidths[2] * 3, 40, "DATE D'APPLICATION ", { align: "left", bold: true });
    drawCell(30 + colWidths[0] * 3, y, colWidths[1] * 9, 30, currentDate, { bold: true });

    y += 30;
    drawCell(30, y, colWidths[0], 40, "EFP", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0], y, colWidths[1], 40, "groupe", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 2, y, colWidths[2], 40, "Journée", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 4, y, colWidths[3], 40, "de", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 5, y, colWidths[4], 40, "à", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 6, y, colWidths[5], 40, "Salle", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 7, y, colWidths[6], 40, "Formateur", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 10, y, colWidths[7], 40, "Durée de la\nSéance", { bold: true, background: "#CCCCCC" });

    const dayOrder = { LUNDI: 1, MARDI: 2, MERCREDI: 3, JEUDI: 4, VENDREDI: 5, SAMEDI: 6, DIMANCHE: 7 };
    const sortedSchedule = [...transformedSchedule].sort((a, b) => {
      const dayDiff = dayOrder[a.jour] - dayOrder[b.jour];
      if (dayDiff !== 0) return dayDiff;
      const [aHours, aMinutes] = a.debut.split(":").map(Number);
      const [bHours, bMinutes] = b.debut.split(":").map(Number);
      const aTime = aHours * 60 + aMinutes;
      const bTime = bHours * 60 + bMinutes;
      return aTime - bTime;
    });

    y += 40;
    const durations = [];
    sortedSchedule.forEach((item) => {
      durations.push(item.duree);
      drawCell(30, y, colWidths[0], 30, item.efp);
      drawCell(30 + colWidths[0], y, colWidths[1], 30, item.groupe);
      drawCell(30 + colWidths[0] * 2, y, colWidths[2], 30, item.jour);
      drawCell(30 + colWidths[0] * 4, y, colWidths[3], 30, item.debut);
      drawCell(30 + colWidths[0] * 5, y, colWidths[4], 30, item.fin);
      drawCell(30 + colWidths[0] * 6, y, colWidths[5], 30, item.salle);
      drawCell(30 + colWidths[0] * 7, y, colWidths[6], 30, item.formateur);
      drawCell(30 + colWidths[0] * 10, y, colWidths[7], 30, item.duree);
      y += 30;
    });

    const totalHours = calculateTotalHours(durations);

    y += 5;
    drawCell(30, y, colWidths[0] * 10, 30, "MASSE HORAIRE HEBDOMADAIRE", { bold: true });
    drawCell(30 + colWidths[0] * 10, y, colWidths[1] * 2, 30, totalHours, { bold: true });

    y += 50;
    drawCell(30, y, colWidths[0] * 4, 60, "FORMATEUR", { bold: true });
    drawCell(30 + colWidths[0] * 4, y, colWidths[1] * 4, 60, "EMARGEMENT DIRECTEUR EFP", { bold: true });
    drawCell(30 + colWidths[0] * 8, y, colWidths[1] * 4, 60, "EMARGEMENT DIRECTEUR DU COMPLEXE", { bold: true });

    y += 60;
    drawCell(30, y, colWidths[0] * 4, 60, formateur ? formateur.name : "");
    drawCell(30 + colWidths[0] * 4, y, colWidths[1] * 4, 60, "", { align: "center" });
    drawCell(30 + colWidths[0] * 8, y, colWidths[1] * 4, 60, "");

    doc.end();
  } catch (error) {
    console.error('Error in exportSchedulePDF:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Export formateur schedule as PDF (unchanged)
const exportFormateurPDF = async (req, res) => {
  const { id } = req.params;

  try {
    const formateur = await Formateur.findById(id).select('name email phoneNumber address role');
    if (!formateur) {
      return res.status(404).json({ message: 'Formateur non trouvé.' });
    }

    const timeSlots = [
      { id: 1, start: "8:30", end: "11:00" },
      { id: 2, start: "11:00", end: "13:30" },
      { id: 3, start: "13:30", end: "16:00" },
      { id: 4, start: "16:00", end: "18:30" },
    ];

    function calculateDuration(startTime, endTime) {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);

      let durationMinutes = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }

      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }

    function calculateTotalHours(durations) {
      let totalMinutes = 0;

      durations.forEach((duration) => {
        const [hours, minutes] = duration.split(":").map(Number);
        totalMinutes += hours * 60 + minutes;
      });

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }

    const scheduleData = await Schedule.find({ formateur: id })
      .populate('formateur', 'name')
      .lean();

    const etablissements = await Etablissement.find().lean();
    const salleToEFP = {};
    etablissements.forEach((etab) => {
      etab.salles.forEach((salle) => {
        salleToEFP[salle] = etab.name;
      });
    });

    const transformedSchedule = scheduleData.map(schedule => ({
      efp: salleToEFP[schedule.salle] || "N/A",
      groupe: schedule.groupe?.name || "N/A",
      jour: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'][schedule.dayId - 1] || 'LUNDI',
      debut: timeSlots[schedule.slotId - 1]?.start || "8:30",
      fin: timeSlots[schedule.slotId - 1]?.end || "11:00",
      salle: schedule.salle || "N/A",
      formateur: schedule.formateur?.name || formateur.name,
      duree: calculateDuration(
        timeSlots[schedule.slotId - 1]?.start || "8:30",
        timeSlots[schedule.slotId - 1]?.end || "11:00"
      ),
    }));

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 30, bottom: 30, left: 30, right: 30 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="emploi-du-temps-${formateur.name.toLowerCase().replace(/ /g, '-')}-${id}.pdf"`);
    doc.pipe(res);

    const drawCell = (x, y, width, height, text, options = {}) => {
      const defaultOptions = {
        align: "center",
        fontSize: 12,
        bold: false,
        background: false,
        border: true,
      };
      const opts = { ...defaultOptions, ...options };

      if (opts.background) {
        doc.fillColor(opts.background).rect(x, y, width, height).fill();
      }
      if (opts.border) {
        doc.strokeColor("#000000").lineWidth(0.5).rect(x, y, width, height).stroke();
      }
      if (text) {
        doc.fillColor("#000000");
        doc.fontSize(opts.fontSize);
        doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica");

        const textHeight = doc.currentLineHeight();
        const textY = y + (height - textHeight) / 2;

        if (opts.align === "center") {
          doc.text(text, x, textY, { width, align: "center" });
        } else if (opts.align === "left") {
          doc.text(text, x + 5, textY, { width: width - 10, align: "left" });
        }
      }
    };

    const totalWidth = 782;
    const colWidths = [
      totalWidth * (1 / 12),
      totalWidth * (1 / 12),
      totalWidth * (2 / 12),
      totalWidth * (1 / 12),
      totalWidth * (1 / 12),
      totalWidth * (1 / 12),
      totalWidth * (3 / 12),
      totalWidth * (2 / 12),
    ];

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    const currentDate = new Date().toLocaleDateString("fr-FR");

    let y = 30;
    drawCell(30, y, colWidths[0] * 3, 40, "OFPPT", { bold: true, fontSize: 14 });
    drawCell(30 + colWidths[0] * 3, y, colWidths[1] * 5, 40, "EMPLOI DU TEMPS", { bold: true, fontSize: 14 });
    drawCell(30 + colWidths[0] * 8, y, colWidths[2] * 1, 40, "CFPB", { bold: true, fontSize: 14 });
    drawCell(30 + colWidths[0] * 10, y, colWidths[3] * 1, 40, `ANNEE\n${academicYear}`, { fontSize: 9 });
    drawCell(30 + colWidths[0] * 11, y, colWidths[4], 40, "en cours", { fontSize: 8 });

    y += 40;
    drawCell(30, y, colWidths[0] * 3, 40, "FORMATEUR", { bold: true });
    drawCell(30 + colWidths[0] * 3, y, colWidths[1] * 9, 40, formateur.name.toUpperCase(), { bold: true, fontSize: 20 });

    y += 40;
    drawCell(30, y, colWidths[2] * 3, 40, "DATE D'APPLICATION ", { align: "left", bold: true });
    drawCell(30 + colWidths[0] * 3, y, colWidths[1] * 9, 30, currentDate, { bold: true });

    y += 30;
    drawCell(30, y, colWidths[0], 40, "EFP", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0], y, colWidths[1], 40, "groupe", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 2, y, colWidths[2], 40, "Journée", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 4, y, colWidths[3], 40, "de", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 5, y, colWidths[4], 40, "à", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 6, y, colWidths[5], 40, "Salle", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 7, y, colWidths[6], 40, "Formateur", { bold: true, background: "#CCCCCC" });
    drawCell(30 + colWidths[0] * 10, y, colWidths[7], 40, "Durée de la\nSéance", { bold: true, background: "#CCCCCC" });

    const dayOrder = { LUNDI: 1, MARDI: 2, MERCREDI: 3, JEUDI: 4, VENDREDI: 5, SAMEDI: 6, DIMANCHE: 7 };
    const sortedSchedule = [...transformedSchedule].sort((a, b) => {
      const dayDiff = dayOrder[a.jour] - dayOrder[b.jour];
      if (dayDiff !== 0) return dayDiff;
      const [aHours, aMinutes] = a.debut.split(":").map(Number);
      const [bHours, bMinutes] = b.debut.split(":").map(Number);
      const aTime = aHours * 60 + aMinutes;
      const bTime = bHours * 60 + bMinutes;
      return aTime - bTime;
    });

    y += 40;
    const durations = [];
    sortedSchedule.forEach((item) => {
      durations.push(item.duree);
      drawCell(30, y, colWidths[0], 30, item.efp);
      drawCell(30 + colWidths[0], y, colWidths[1], 30, item.groupe);
      drawCell(30 + colWidths[0] * 2, y, colWidths[2], 30, item.jour);
      drawCell(30 + colWidths[0] * 4, y, colWidths[3], 30, item.debut);
      drawCell(30 + colWidths[0] * 5, y, colWidths[4], 30, item.fin);
      drawCell(30 + colWidths[0] * 6, y, colWidths[5], 30, item.salle);
      drawCell(30 + colWidths[0] * 7, y, colWidths[6], 30, item.formateur);
      drawCell(30 + colWidths[0] * 10, y, colWidths[7], 30, item.duree);
      y += 30;
    });

    const totalHours = calculateTotalHours(durations);

    y += 5;
    drawCell(30, y, colWidths[0] * 10, 30, "MASSE HORAIRE HEBDOMADAIRE", { bold: true });
    drawCell(30 + colWidths[0] * 10, y, colWidths[1] * 2, 30, totalHours, { bold: true });

    y += 50;
    drawCell(30, y, colWidths[0] * 4, 60, "FORMATEUR", { bold: true });
    drawCell(30 + colWidths[0] * 4, y, colWidths[1] * 4, 60, "EMARGEMENT DIRECTEUR EFP", { bold: true });
    drawCell(30 + colWidths[0] * 8, y, colWidths[1] * 4, 60, "EMARGEMENT DIRECTEUR DU COMPLEXE", { bold: true });

    y += 60;
    drawCell(30, y, colWidths[0] * 4, 60, formateur.name);
    drawCell(30 + colWidths[0] * 4, y, colWidths[1] * 4, 60, "", { align: "center" });
    drawCell(30 + colWidths[0] * 8, y, colWidths[1] * 4, 60, "");

    doc.end();
  } catch (error) {
    console.error('Error in exportFormateurPDF:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
const confirmAllDrafts = asyncHandler(async (req, res) => {
  const drafts = await Draft.find({});

  if (drafts.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'Aucun brouillon à confirmer',
      data: [],
    });
  }

  const modifiedSchedules = [];
  const errors = [];
  const confirmationDate = new Date();

  const isValidObjectId = (id) => {
    if (!id) return false;
    return ObjectId.isValid(id) && String(new ObjectId(id)) === String(id);
  };

  try {
    // Process drafts
    for (const draft of drafts) {
      try {
        if (!isValidObjectId(draft._id)) {
          errors.push({
            draftId: draft._id?.toString() || 'unknown',
            message: `Identifiant du brouillon invalide: ${draft._id}`,
          });
          continue;
        }
        if (!isValidObjectId(draft.formateur)) {
          errors.push({
            draftId: draft._id.toString(),
            message: `Identifiant formateur invalide pour le brouillon ${draft._id}`,
          });
          continue;
        }
        if (!isValidObjectId(draft.filiere)) {
          errors.push({
            draftId: draft._id.toString(),
            message: `Identifiant filière invalide pour le brouillon ${draft._id}`,
          });
          continue;
        }
        if (draft.module?.formateur && !isValidObjectId(draft.module.formateur)) {
          errors.push({
            draftId: draft._id.toString(),
            message: `Identifiant module.formateur invalide pour le brouillon ${draft._id}`,
          });
          continue;
        }

        if (!draft.groupe?.name || !draft.salle || !draft.dayId || !draft.slotId || !draft.module?.name) {
          errors.push({
            draftId: draft._id.toString(),
            message: `Champs requis manquants pour le brouillon ${draft._id}`,
          });
          continue;
        }

        const existingSchedule = await Schedule.findOne({
          $or: [
            { formateur: draft.formateur, dayId: draft.dayId, slotId: draft.slotId },
            { salle: draft.salle, dayId: draft.dayId, slotId: draft.slotId },
            { 'groupe.name': draft.groupe.name, dayId: draft.dayId, slotId: draft.slotId },
          ],
        });

        let schedule;

        if (existingSchedule) {
          const conflictSchedule = await Schedule.findOne({
            _id: { $ne: existingSchedule._id },
            $or: [
              { formateur: draft.formateur, dayId: draft.dayId, slotId: draft.slotId },
              { salle: draft.salle, dayId: draft.dayId, slotId: draft.slotId },
              { 'groupe.name': draft.groupe.name, dayId: draft.dayId, slotId: draft.slotId },
            ],
          });

          if (conflictSchedule) {
            errors.push({
              draftId: draft._id.toString(),
              message: `Conflit pour le brouillon ${draft._id}: le formateur, la salle ou le groupe est déjà occupé`,
            });
            continue;
          }

          schedule = await Schedule.findByIdAndUpdate(
            existingSchedule._id,
            {
              formateur: draft.formateur,
              salle: draft.salle,
              groupe: draft.groupe,
              filiere: draft.filiere,
              dayId: draft.dayId,
              slotId: draft.slotId,
              module: draft.module,
            },
            { new: true }
          )
            .populate({
              path: 'formateur',
              select: 'name',
              match: { _id: { $exists: true, $ne: null } },
            })
            .populate({
              path: 'filiere',
              select: 'name',
              match: { _id: { $exists: true, $ne: null } },
            })
            .populate({
              path: 'module.formateur',
              select: 'name',
              match: { _id: { $exists: true, $ne: null } },
            })
            .lean();
        } else {
          const conflictSchedule = await Schedule.findOne({
            $or: [
              { formateur: draft.formateur, dayId: draft.dayId, slotId: draft.slotId },
              { salle: draft.salle, dayId: draft.dayId, slotId: draft.slotId },
              { 'groupe.name': draft.groupe.name, dayId: draft.dayId, slotId: draft.slotId },
            ],
          });

          if (conflictSchedule) {
            errors.push({
              draftId: draft._id.toString(),
              message: `Conflit pour le brouillon ${draft._id}: le formateur, la salle ou le groupe est déjà occupé`,
            });
            continue;
          }

          schedule = await Schedule.create({
            formateur: draft.formateur,
            salle: draft.salle,
            groupe: draft.groupe,
            filiere: draft.filiere,
            dayId: draft.dayId,
            slotId: draft.slotId,
            module: draft.module,
          });

          schedule = await Schedule.findById(schedule._id)
            .populate({
              path: 'formateur',
              select: 'name',
              match: { _id: { $exists: true, $ne: null } },
            })
            .populate({
              path: 'filiere',
              select: 'name',
              match: { _id: { $exists: true, $ne: null } },
            })
            .populate({
              path: 'module.formateur',
              select: 'name',
              match: { _id: { $exists: true, $ne: null } },
            })
            .lean();
        }

        if (!isValidObjectId(schedule._id)) {
          errors.push({
            draftId: draft._id.toString(),
            message: `Identifiant du schedule créé/mis à jour invalide pour le brouillon ${draft._id}`,
          });
          continue;
        }

        await Draft.deleteOne({ _id: draft._id });

        modifiedSchedules.push(schedule);
      } catch (error) {
        console.error(`Error confirming draft ${draft._id}:`, error.message, error.stack);
        errors.push({
          draftId: draft._id?.toString() || 'unknown',
          message: error.message || 'Erreur lors de la confirmation du brouillon',
        });
      }
    }

    // Fetch all confirmed schedules
    const confirmedSchedules = await Schedule.find({})
      .populate({
        path: 'formateur',
        select: 'name',
        match: { _id: { $exists: true, $ne: null } },
      })
      .populate({
        path: 'filiere',
        select: 'name',
        match: { _id: { $exists: true, $ne: null } },
      })
      .populate({
        path: 'module.formateur',
        select: 'name',
        match: { _id: { $exists: true, $ne: null } },
      })
      .lean();

    // Combine modified and confirmed schedules, avoiding duplicates
    const allSchedules = [
      ...modifiedSchedules,
      ...confirmedSchedules.filter(
        (cs) => !modifiedSchedules.some((ms) => ms._id.toString() === cs._id.toString())
      ),
    ];

    // Save to ScheduleHistory if there are schedules
    if (allSchedules.length > 0) {
      const transformedSchedules = transformSchedules(allSchedules);
      await ScheduleHistory.create({
        schedules: transformedSchedules,
        action: 'CONFIRMED',
        createdAt: new Date(),
        confirmationDate,
      });
    }

    if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        message: 'Confirmation partielle : certains brouillons ont échoué',
        data: modifiedSchedules,
        errors,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tous les brouillons ont été confirmés avec succès',
      data: modifiedSchedules,
    });
  } catch (error) {
    console.error('Fatal error in confirmAllDrafts:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: `Erreur serveur lors de la confirmation des brouillons: ${error.message}`,
      data: [],
      errors,
    });
  }
});
const getScheduleHistory = asyncHandler(async (req, res) => {
  const { date } = req.query;

  try {
    let query = {};
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Date de confirmation invalide.',
        });
      }
      query.confirmationDate = parsedDate;
    }

    const history = await ScheduleHistory.find(query).lean();
    console.log('Raw history from DB:', history); // Debug log

    if (!history || history.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Aucun historique disponible.',
        data: [],
      });
    }

    // Transform and filter valid history entries
    const transformedHistory = history
      .filter((group) => {
        const isValid = group && Array.isArray(group.schedules);
        if (!isValid) {
          console.warn('Invalid history group:', group);
        }
        return isValid;
      })
      .map((group) => ({
        confirmationDate: group.confirmationDate,
        schedules: group.schedules
          .filter((entry) => entry && entry.id && entry.formateur && entry.filiere)
          .map((entry) => ({
            id: entry.id,
            scheduleId: entry.id, // For compatibility
            formateur: entry.formateur || null,
            salle: entry.salle || 'N/A',
            groupe: entry.groupe || 'N/A',
            filiere: entry.filiere || null,
            jour: entry.jour || 'N/A',
            slot: entry.slot || 0,
            module: entry.module || null,
            action: group.action || 'CONFIRMED',
            createdAt: group.createdAt || new Date(),
          })),
        action: group.action,
        createdAt: group.createdAt,
      }));

    return res.status(200).json({
      success: true,
      message: 'Historique récupéré avec succès.',
      data: transformedHistory,
    });
  } catch (error) {
    console.error('Error fetching schedule history:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: `Erreur serveur : ${error.message}`,
    });
  }
});



module.exports = {
  createDraft,
  getDrafts,
  getDraft,
  updateDraft,
  deleteDraft,
  confirmDraft,
  confirmAllDrafts,
  createSchedule,
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  exportSchedulePDF,
  exportFormateurPDF,
  getScheduleHistory, 
  updateDraft,
};