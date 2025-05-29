const mongoose = require('mongoose');

const EtablissementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom pour l\'établissement'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
  },
  salles: [{
    type: String,
    trim: true,
    maxlength: [50, 'Le nom de la salle ne peut pas dépasser 50 caractères'],
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Etablissement', EtablissementSchema);