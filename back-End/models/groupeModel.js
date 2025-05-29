const mongoose = require('mongoose');

const groupeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du groupe est requis'],
    trim: true,
    maxlength: [50, 'Le nom du groupe ne peut pas dépasser 50 caractères'],
  },
  filiere: {
    type: mongoose.Schema.ObjectId,
    ref: 'Filiere',
    required: [true, 'La filière est requise'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

module.exports = mongoose.model('Groupe', groupeSchema);