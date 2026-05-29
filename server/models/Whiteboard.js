const mongoose = require('mongoose');
const mockDb = require('../config/mockDb');

const whiteboardSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  elements: {
    type: Array, // Array of canvas elements (lines, shapes, text)
    default: []
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

let Model;
if (process.env.USE_MOCK_DB === 'true') {
  Model = mockDb.collection('whiteboards');
} else {
  Model = mongoose.model('Whiteboard', whiteboardSchema);
}

module.exports = Model;
