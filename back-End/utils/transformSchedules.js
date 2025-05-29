const transformSchedules = (schedules) => {
  return schedules
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
};

module.exports = { transformSchedules };