const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const mockDb = require('../config/mockDb');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  role: {
    type: String,
    enum: ['Admin', 'Member', 'Viewer'],
    default: 'Member'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  bio: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  skills: {
    type: String,
    default: ''
  },
  github: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt for Mongoose
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create a combined model exporter that switches transparently
let Model;

if (process.env.USE_MOCK_DB === 'true' || (!mongoose.connection.readyState && process.env.NODE_ENV === 'test')) {
  // Mock DB model wrapper
  const collection = mockDb.collection('users');
  
  // Extend mock collection with auth helpers
  Model = Object.create(collection);
  Model.create = async (data) => {
    // Skip if already bcrypt-hashed (e.g. legacy seed data)
    if (data.password && !/^\$2[aby]\$/.test(data.password)) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }
    return collection.create(data);
  };
  Model.matchPassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  };
} else {
  Model = mongoose.model('User', userSchema);
  Model.matchPassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  };
}

module.exports = Model;
