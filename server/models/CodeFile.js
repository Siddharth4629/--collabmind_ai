const mongoose = require('mongoose');
const mockDb = require('../config/mockDb');

const codeFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Please add a filename'],
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    required: [true, 'Please specify code language'],
    default: 'javascript'
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
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
  Model = mockDb.collection('codefiles');
} else {
  Model = mongoose.model('CodeFile', codeFileSchema);
}

module.exports = Model;
