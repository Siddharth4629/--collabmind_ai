const mongoose = require('mongoose');
const mockDb = require('../config/mockDb');

const activitySchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String
  }
}, {
  timestamps: true
});

let Model;
if (process.env.USE_MOCK_DB === 'true') {
  Model = mockDb.collection('activities');
} else {
  Model = mongoose.model('Activity', activitySchema);
}

module.exports = Model;
