const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  dayId: {
    type: Number,
    required: [true, 'Le jour est requis'],
    enum: [1, 2, 3, 4, 5, 6], // 1: Lundi, 2: Mardi, ..., 6: Samedi
  },
  slotId: {
    type: Number,
    required: [true, 'Le créneau horaire est requis'],
    enum: [1, 2, 3, 4], // 1: 8:30-11:00, 2: 11:00-13:30, 3: 13:30-16:00, 4: 16:00-18:30
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
});

// Update updatedAt on save
scheduleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Schedule', scheduleSchema);