const mongoose = require('mongoose');

const SuperadminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  address: { type: String },
  role: {
    type: String,
    default: 'Superadmin',
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

module.exports = mongoose.model('Superadmin', SuperadminSchema);