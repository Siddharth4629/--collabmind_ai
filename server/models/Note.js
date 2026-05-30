const mongoose = require('mongoose');
const mockDb = require('../config/mockDb');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a note title'],
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  versions: [
    {
      content: {
        type: String,
        default: ''
      },
      updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});

let Model;
if (process.env.USE_MOCK_DB === 'true') {
  Model = mockDb.collection('notes');
} else {
  Model = mongoose.model('Note', noteSchema);
}

module.exports = Model;
