const mongoose = require('mongoose');
const mockDb = require('../config/mockDb');

const chatSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Please add a chat message']
  },
  readBy: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

let Model;
if (process.env.USE_MOCK_DB === 'true') {
  Model = mockDb.collection('chats');
} else {
  Model = mongoose.model('Chat', chatSchema);
}

module.exports = Model;
