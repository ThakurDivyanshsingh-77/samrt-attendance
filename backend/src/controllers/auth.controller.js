const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { validationResult } = require('express-validator');

// ==============================
// 🔐 Generate JWT Token
// ==============================
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '24h'
    }
  );
};

// ==============================
// 🧑‍🎓 Student Signup
// POST /api/auth/signup
// ==============================
exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, rollNumber, year, semester } = req.body;

    // 🔴 Fix: rollNumber check only if provided
    const query = [{ email }];
    if (rollNumber) query.push({ rollNumber });

    const existingUser = await User.findOne({ $or: query });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? 'Email already registered'
            : 'Roll number already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      rollNumber,
      year,
      semester,
      role: 'student'
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        year: user.year,
        semester: user.semester
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ==============================
// 🔑 Login (Teacher & Student)
// POST /api/auth/login
// ==============================
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 🔥 VERY IMPORTANT
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    if (user.role === 'student') {
      userData.rollNumber = user.rollNumber;
      userData.year = user.year;
      userData.semester = user.semester;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ==============================
// 👤 Get Current User
// GET /api/auth/me
// ==============================
exports.getMe = async (req, res) => {
  try {
    const user = req.user;

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    if (user.role === 'student') {
      userData.rollNumber = user.rollNumber;
      userData.year = user.year;
      userData.semester = user.semester;
    }

    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
