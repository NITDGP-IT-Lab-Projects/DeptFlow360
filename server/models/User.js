const mongoose = require('mongoose');
const { comparePassword } = require('../utils/auth');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['HOD', 'COORDINATOR', 'FACULTY', 'PG_STUDENT', 'UG_STUDENT'],
      message: '{VALUE} is not a recognized academic role'
    },
    default: 'UG_STUDENT'
  },
  department: {
    type: String,
    default: 'Information Technology'
  },
  designation: {
    type: String,
    default: 'Student'
  },
  referenceId: {
    type: String,
    default: null // Maps to FAC-01 or Student Roll Number
  },
  avatar: {
    type: String,
    default: '👤'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compare password instance method
userSchema.methods.matchPassword = async function(candidatePassword) {
  return await comparePassword(candidatePassword, this.password);
};

// Exclude password from default JSON serialization
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
