const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: new Date().setHours(0, 0, 0, 0) // Normalize to midnight
  },
  tasks: {
    exercise: { type: Boolean, default: false },
    eatHealthy: { type: Boolean, default: false },
    meditation: { type: Boolean, default: false },
    reading: { type: Boolean, default: false },
    learning: { type: Boolean, default: false },
    noSocialMedia: { type: Boolean, default: false },
    noFap: { type: Boolean, default: false },
    noBinge: { type: Boolean, default: false },
  },
  totalPoints: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Point', PointSchema);
