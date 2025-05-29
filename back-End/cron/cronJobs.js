const cron = require('node-cron');
const Schedule = require('../models/Schedule');
const ScheduleHistory = require('../models/ScheduleHistory');
const Formateur = require('../models/Formateur');
const Salle = require('../models/Salle');

// Helper function to copy the previous week's schedule to the next week
const copyPreviousWeekSchedule = async () => {
  try {
    console.log('Cron job started: Copying previous week\'s schedule to next week');

    // Step 1: Fetch current week's schedule
    const currentSchedules = await Schedule.find().populate([
      { path: 'formateur', select: 'name' },
      { path: 'salle', select: 'name' },
    ]);

    if (currentSchedules.length === 0) {
      console.log('No schedules found for the current week. Skipping copy.');
      return;
    }

    // Step 2: Save current schedule to history
    await ScheduleHistory.create({
      schedules: currentSchedules.map((s) => ({
        dayId: s.dayId,
        slotId: s.slotId,
        formateur: s.formateur._id,
        salle: s.salle._id,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      changeDate: new Date(),
    });
    console.log('Current schedule saved to history');

    // Step 3: Validate and prepare new schedule entries
    const newSchedules = [];
    const conflicts = [];

    for (const schedule of currentSchedules) {
      const { dayId, slotId, formateur, salle } = schedule;

      // Validate formateur exists and is still a Formateur
      const formateurExists = await Formateur.findOne({ _id: formateur._id, role: 'Formateur' });
      if (!formateurExists) {
        conflicts.push(`Formateur ${formateur.name} no longer valid for dayId ${dayId}, slotId ${slotId}`);
        continue;
      }

      // Validate salle exists
      const salleExists = await Salle.findOne({ _id: salle._id });
      if (!salleExists) {
        conflicts.push(`Salle ${salle.name} no longer valid for dayId ${dayId}, slotId ${slotId}`);
        continue;
      }

      // Check constraints for the next week
      const existingNextWeekSchedules = await Schedule.find({ dayId, slotId }).populate([
        { path: 'formateur', select: 'name' },
        { path: 'salle', select: 'name' },
      ]);

      // Constraint 1: Same Formateur and Salle
      const duplicateAssignment = existingNextWeekSchedules.find(
        (s) => s.formateur.name === formateur.name && s.salle.name === salle.name
      );
      if (duplicateAssignment) {
        conflicts.push(`Duplicate assignment for Formateur ${formateur.name} and Salle ${salle.name} in dayId ${dayId}, slotId ${slotId}`);
        continue;
      }

      // Constraint 2: Same Formateur in different Salle
      const formateurConflict = existingNextWeekSchedules.find(
        (s) => s.formateur.name === formateur.name && s.salle.name !== salle.name
      );
      if (formateurConflict) {
        conflicts.push(`Formateur ${formateur.name} already assigned to Salle ${formateurConflict.salle.name} in dayId ${dayId}, slotId ${slotId}`);
        continue;
      }

      // Constraint 3: Same Salle
      const salleConflict = existingNextWeekSchedules.find(
        (s) => s.salle.name === salle.name
      );
      if (salleConflict) {
        conflicts.push(`Salle ${salle.name} already assigned in dayId ${dayId}, slotId ${slotId}`);
        continue;
      }

      // Add valid schedule to newSchedules
      newSchedules.push({
        dayId,
        slotId,
        formateur: formateur._id,
        salle: salle._id,
      });
    }

    // Step 4: Insert new schedules for the next week
    if (newSchedules.length > 0) {
      await Schedule.insertMany(newSchedules);
      console.log(`Inserted ${newSchedules.length} schedule entries for the next week`);
    } else {
      console.log('No valid schedules to insert after validation');
    }

    // Step 5: Log conflicts (if any)
    if (conflicts.length > 0) {
      console.warn('Conflicts detected during schedule copy:');
      conflicts.forEach((conflict) => console.warn(conflict));
    }

  } catch (error) {
    console.error('Error in copyPreviousWeekSchedule:', error.message);
  }
};

// Schedule the cron job to run every Sunday at 00:00
const scheduleCronJobs = () => {
  cron.schedule('0 0 * * 0', () => {
    console.log('Running weekly schedule copy cron job');
    copyPreviousWeekSchedule();
  });
};

module.exports = { scheduleCronJobs };