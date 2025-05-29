// Salle.js
const mongoose = require('mongoose');

const SalleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom pour la salle'],
    unique: true,
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
  },
  etablissement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etablissement',
    required: [true, 'L\'établissement est requis'],
  },
  secteur: {
    type: [String],
    required: [true, 'Veuillez spécifier au moins un secteur'],
    validate: {
      validator: function (array) {
        return array.length > 0;
      },
      message: 'Le secteur doit contenir au moins un élément',
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Salle', SalleSchema);