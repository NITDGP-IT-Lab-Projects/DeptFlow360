const mongoose = require('mongoose');
const User = require('../models/User');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

// Resilient in-memory user store for degraded mode or when MongoDB connection is pending
const inMemoryUsers = new Map();

// Helper to seed in-memory users on module load
const initDefaultUsers = async () => {
  const defaultAccounts = [
    {
      id: 'USR-HOD-01',
      name: 'Dr. Rajeshwar Sen',
      email: 'hod.it@university.edu',
      passwordPlain: 'Admin@123',
      role: 'HOD',
      designation: 'Professor & Head of Department',
      department: 'Information Technology',
      referenceId: 'FAC-01',
      avatar: '👨‍💼'
    },
    {
      id: 'USR-COORD-02',
      name: 'Dr. Ananya Roy',
      email: 'ananya.roy@university.edu',
      passwordPlain: 'Coord@123',
      role: 'COORDINATOR',
      designation: 'Associate Professor & Project Convener',
      department: 'Information Technology',
      referenceId: 'FAC-02',
      avatar: '👩‍🏫'
    },
    {
      id: 'USR-FAC-03',
      name: 'Dr. Vikramaditya Das',
      email: 'vikram.das@university.edu',
      passwordPlain: 'Guide@123',
      role: 'FACULTY',
      designation: 'Associate Professor',
      department: 'Information Technology',
      referenceId: 'FAC-03',
      avatar: '👨‍🏫'
    },
    {
      id: 'USR-PG-01',
      name: 'Sneha Mukherjee',
      email: 'sneha.m@university.edu',
      passwordPlain: 'Student@123',
      role: 'PG_STUDENT',
      designation: 'PG Scholar (M.Tech 2nd Year)',
      department: 'Information Technology',
      referenceId: 'PG-2025-01',
      avatar: '👩‍💻'
    },
    {
      id: 'USR-UG-04',
      name: 'Rahul Verma (Team 04 Lead)',
      email: 'team04.lead@university.edu',
      passwordPlain: 'Student@123',
      role: 'UG_STUDENT',
      designation: 'B.Tech Capstone Lead (Team 04)',
      department: 'Information Technology',
      referenceId: 'UG-2024-04',
      avatar: '👨‍🎓'
    }
  ];

  for (const acc of defaultAccounts) {
    const hashedPassword = await hashPassword(acc.passwordPlain);
    inMemoryUsers.set(acc.email.toLowerCase(), {
      _id: acc.id,
      name: acc.name,
      email: acc.email.toLowerCase(),
      password: hashedPassword,
      role: acc.role,
      designation: acc.designation,
      department: acc.department,
      referenceId: acc.referenceId,
      avatar: acc.avatar,
      createdAt: new Date(),
      lastLogin: null
    });
  }
};

initDefaultUsers().catch(err => console.error('Failed to initialize default in-memory users:', err));

/**
 * @desc    Register a new user with hashed password
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { name, email, password, role, designation, department } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email address, and a secure password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters in length.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const validatedRole = ['HOD', 'COORDINATOR', 'FACULTY', 'PG_STUDENT', 'UG_STUDENT'].includes(role)
      ? role
      : 'UG_STUDENT';

    // 2. Hash password
    const hashedPassword = await hashPassword(password);

    // 3. Check MongoDB if connected
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.'
        });
      }

      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: validatedRole,
        designation: designation || (validatedRole.includes('STUDENT') ? 'Student Scholar' : 'Faculty Member'),
        department: department || 'Information Technology'
      });

      // Synchronize in-memory mirror
      inMemoryUsers.set(normalizedEmail, {
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        password: hashedPassword,
        role: newUser.role,
        designation: newUser.designation
      });

      const token = generateToken({
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        designation: newUser.designation
      });

      return res.status(201).json({
        success: true,
        message: 'User account created successfully.',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          designation: newUser.designation,
          department: newUser.department
        }
      });
    } else {
      // Degraded In-Memory Store
      if (inMemoryUsers.has(normalizedEmail)) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.'
        });
      }

      const memId = `USR-${Date.now().toString(36).toUpperCase()}`;
      const memUser = {
        _id: memId,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: validatedRole,
        designation: designation || (validatedRole.includes('STUDENT') ? 'Student Scholar' : 'Faculty Member'),
        department: department || 'Information Technology',
        createdAt: new Date(),
        lastLogin: null
      };

      inMemoryUsers.set(normalizedEmail, memUser);

      const token = generateToken({
        id: memId,
        email: normalizedEmail,
        name: memUser.name,
        role: memUser.role,
        designation: memUser.designation
      });

      return res.status(201).json({
        success: true,
        message: 'User account registered (session active).',
        token,
        user: {
          id: memId,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          designation: memUser.designation,
          department: memUser.department
        }
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error occurred during user registration.'
    });
  }
};

/**
 * @desc    Sign in user & compare hashed password
 * @route   POST /api/auth/signin
 * @access  Public
 */
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email address and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    let user = null;

    if (isDbConnected) {
      user = await User.findOne({ email: normalizedEmail });
    }

    // Fallback to in-memory store if not found or DB offline
    if (!user && inMemoryUsers.has(normalizedEmail)) {
      user = inMemoryUsers.get(normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password.'
      });
    }

    // Verify password against stored hash
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Password verification failed.'
      });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    if (isDbConnected && typeof user.save === 'function') {
      await user.save();
    }

    const userId = user._id ? user._id.toString() : user.id;

    const token = generateToken({
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role,
      designation: user.designation
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department || 'Information Technology',
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error occurred during user sign-in.'
    });
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private (Bearer JWT)
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get list of registered users for auditing / directory
 * @route   GET /api/auth/users
 * @access  Private
 */
const getUsers = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let usersList = [];

    if (isDbConnected) {
      usersList = await User.find().select('-password').sort({ createdAt: -1 });
    }

    if (usersList.length === 0) {
      usersList = Array.from(inMemoryUsers.values()).map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        designation: u.designation,
        department: u.department,
        lastLogin: u.lastLogin
      }));
    }

    return res.status(200).json({
      success: true,
      count: usersList.length,
      data: usersList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  signup,
  signin,
  getMe,
  getUsers,
  inMemoryUsers
};
