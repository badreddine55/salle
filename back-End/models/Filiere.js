const mongoose = require('mongoose');

const filiereSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la filière est requis'],
    unique: true,
    trim: true,
    maxlength: [50, 'Le nom de la filière ne peut pas dépasser 50 caractères'],
    minlength: [2, 'Le nom de la filière doit contenir au moins 2 caractères'],
  },
  groups: [{
    name: {
      type: String,
      required: [true, 'Le nom du groupe est requis'],
      trim: true,
      maxlength: [50, 'Le nom du groupe ne peut pas dépasser 50 caractères'],
    },
  }],
  modules: [{
    name: {
      type: String,
      required: [true, 'Le nom du module est requis'],
      trim: true,
      maxlength: [50, 'Le nom du module ne peut pas dépasser 50 caractères'],
    },
  }],
  etablissement: {
    type: mongoose.Schema.ObjectId,
    ref: 'Etablissement',
    required: [true, 'L\'établissement est requis'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});


filiereSchema.index({ etablissement: 1 });

module.exports = mongoose.model('Filiere', filiereSchema);