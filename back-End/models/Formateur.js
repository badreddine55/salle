const mongoose = require('mongoose');

const FormateurSchema = new mongoose.Schema({
  matricule: {
    type: String,
    required: [true, 'Please add a matricule'],
    unique: true,
    trim: true,
    maxlength: [20, 'Matricule cannot be more than 20 characters'],
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  phoneNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters'],
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters'],
  },
  role: {
    type: String,
    enum: ['Superadmin', 'Formateur'],
    default: 'Formateur',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Formateur', FormateurSchema);