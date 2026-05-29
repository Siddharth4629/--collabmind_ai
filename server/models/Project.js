const mongoose = require('mongoose');
const mockDb = require('../config/mockDb');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a project description']
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['Admin', 'Member', 'Viewer'],
        default: 'Member'
      }
    }
  ],
  budget: {
    total: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    }
  },
  expenses: [
    {
      _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString()
      },
      title: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      category: {
        type: String,
        default: 'General'
      },
      loggedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning'
  },
  deadline: {
    type: Date
  }
}, {
  timestamps: true
});

let Model;
if (process.env.USE_MOCK_DB === 'true') {
  Model = mockDb.collection('projects');
} else {
  Model = mongoose.model('Project', projectSchema);
}

module.exports = Model;
