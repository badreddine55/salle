const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AuthSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, 
    required: true,
    select: false
  },
  id_person: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'id_person_model',
  },
  id_person_model: {
    type: String,
    required: true,
    enum: ['Superadmin', 'Formateur'],
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

AuthSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

AuthSchema.index({ id_person: 1 });

module.exports = mongoose.model('Auth', AuthSchema);