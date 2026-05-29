const mongoose = require('mongoose');
const mockDb = require('../config/mockDb');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Todo', 'InProgress', 'Review', 'Done'],
    default: 'Todo'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  assignee: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  order: {
    type: Number,
    default: 0
  },
  subtasks: [
    {
      title: {
        type: String,
        required: true
      },
      isCompleted: {
        type: Boolean,
        default: false
      }
    }
  ],
  comments: [
    {
      text: {
        type: String,
        required: true
      },
      user: {
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
  Model = mockDb.collection('tasks');
} else {
  Model = mongoose.model('Task', taskSchema);
}

module.exports = Model;
