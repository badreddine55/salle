const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  formateur: {
    type: mongoose.Schema.ObjectId,
    ref: 'Formateur',
    required: [true, 'Le formateur est requis'],
  },
  salle: {
    type: String,
    required: [true, 'La salle est requise'],
  },
  groupe: {
    name: {
      type: String,
      required: [true, 'Le nom du groupe est requis'],
      trim: true,
      maxlength: [50, 'Le nom du groupe ne peut pas dépasser 50 caractères'],
    },
  },
  filiere: {
    type: mongoose.Schema.ObjectId,
    ref: 'Filiere',
    required: [true, 'La filière est requise'],
  },
  dayId: {
    type: Number,
    required: [true, 'L\'identifiant du jour est requis'],
    min: [1, 'L\'identifiant du jour doit être entre 1 et 6'],
    max: [6, 'L\'identifiant du jour doit être entre 1 et 6'],
  },
  slotId: {
    type: Number,
    required: [true, 'L\'identifiant du créneau est requis'],
    min: [1, 'L\'identifiant du créneau doit être entre 1 et 4'],
    max: [4, 'L\'identifiant du créneau doit être entre 1 et 4'],
  },
  module: {
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Le nom du module ne peut pas dépasser 50 caractères'],
    },
    formateur: {
      type: mongoose.Schema.ObjectId,
      ref: 'Formateur',
    },
  },
}, {
  timestamps: true,
});

scheduleSchema.index({ formateur: 1, dayId: 1, slotId: 1 });
scheduleSchema.index({ salle: 1, dayId: 1, slotId: 1 });
scheduleSchema.index({ 'groupe.name': 1, dayId: 1, slotId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);