const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du module est requis'],
    trim: true,
    maxlength: [50, 'Le nom du module ne peut pas dépasser 50 caractères'],
  },
  formateur: {
    type: mongoose.Schema.ObjectId,
    ref: 'Formateur',
  },
  filiere: {
    type: mongoose.Schema.ObjectId,
    ref: 'Filiere',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Module', moduleSchema);