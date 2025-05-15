const mongoose = require('mongoose');

const scheduleHistorySchema = new mongoose.Schema({
  schedules: [
    {
      dayId: {
        type: Number,
        required: [true, 'Le jour est requis'],
        enum: [1, 2, 3, 4, 5, 6],
      },
      slotId: {
        type: Number,
        required: [true, 'Le créneau horaire est requis'],
        enum: [1, 2, 3, 4],
      },
      formateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Formateur',
        required: [true, 'Le formateur est requis'],
      },
      salle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Salle',
        required: [true, 'La salle est requise'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  changeDate: {
    type: Date,
    default: Date.now,
    required: [true, 'La date de modification est requise'],
  },
});

module.exports = mongoose.model('ScheduleHistory', scheduleHistorySchema);