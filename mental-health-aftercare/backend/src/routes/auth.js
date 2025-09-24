const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('role')
    .optional()
    .isIn(['provider', 'admin', 'family_member'])
    .withMessage('Invalid role specified')
];

// Helper function to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'The provided data is invalid',
      details: errors.array()
    });
  }
  next();
};

// POST /api/auth/register
router.post('/register', validateRegister, checkValidation, asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role = 'provider', phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).json({
      error: 'User already exists',
      message: 'An account with this email address already exists'
    });
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role,
    phone
  });

  // Generate token
  const token = generateToken(user);

  logger.logUserAction('user_registered', user.id, { role });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    },
    token
  });
}));

// POST /api/auth/login
router.post('/login', validateLogin, checkValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password included
  const user = await User.scope('withPassword').findOne({ where: { email } });
  
  if (!user || !user.isActive) {
    logger.logSecurityEvent('failed_login_attempt', null, { email, reason: 'user_not_found_or_inactive' });
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  // Validate password
  const isValidPassword = await user.validatePassword(password);
  if (!isValidPassword) {
    logger.logSecurityEvent('failed_login_attempt', user.id, { email, reason: 'invalid_password' });
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  // Generate token
  const token = generateToken(user);

  logger.logUserAction('user_login', user.id);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    },
    token
  });
}));

// POST /api/auth/logout
router.post('/logout', asyncHandler(async (req, res) => {
  // Note: JWT tokens are stateless, so logout is mainly client-side
  // In a production environment, you might want to maintain a blacklist of tokens
  
  res.json({
    message: 'Logout successful'
  });
}));

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      phone: req.user.phone,
      lastLogin: req.user.lastLogin,
      preferences: req.user.preferences
    }
  });
}));

module.exports = router;