const mongoose = require('mongoose');

const scheduleHistorySchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
  },
  schedules: [{
    id: String,
    formateur: {
      _id: mongoose.Schema.Types.ObjectId,
      name: String,
    },
    salle: String,
    groupe: String,
    filiere: {
      _id: mongoose.Schema.Types.ObjectId,
      name: String,
    },
    jour: String,
    slot: Number,
    module: {
      name: String,
      formateur: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
      },
    },
  }],
  action: {
    type: String,
    enum: ['CREATED', 'UPDATED', 'DELETED', 'CONFIRMED'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  confirmationDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('ScheduleHistory', scheduleHistorySchema);