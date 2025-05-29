const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SuperadminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  phoneNumber: { type: String },
  address: { type: String },
  role: {
    type: String,
    default: 'Superadmin',
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

SuperadminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('Superadmin', SuperadminSchema);