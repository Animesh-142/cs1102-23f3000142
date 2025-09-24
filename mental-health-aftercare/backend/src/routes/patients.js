const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Patient, FamilyMember, User } = require('../models');
const { authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validatePatient = [
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Please select a valid gender'),
  body('diagnosis')
    .isLength({ min: 1, max: 200 })
    .withMessage('Diagnosis is required and must be less than 200 characters'),
  body('dischargeDate')
    .isISO8601()
    .withMessage('Please provide a valid discharge date'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
];

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

// GET /api/patients
router.get('/', authorize(['provider', 'admin']), asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    riskLevel, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Filter by risk level
  if (riskLevel) {
    where.riskLevel = riskLevel;
  }

  // Search functionality
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { diagnosis: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Only show patients belonging to the current provider (unless admin)
  if (req.user.role === 'provider') {
    where.providerId = req.user.id;
  }

  const { count, rows } = await Patient.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    include: [
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: FamilyMember,
        as: 'familyMembers',
        attributes: ['id', 'firstName', 'lastName', 'relationship', 'isPrimary']
      }
    ]
  });

  logger.logDataAccess('patients', req.user.id, 'list');

  res.json({
    patients: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalCount: count,
      limit: parseInt(limit)
    }
  });
}));

// GET /api/patients/:id
router.get('/:id', authorize(['provider', 'admin']), 
  param('id').isUUID().withMessage('Invalid patient ID'),
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const patient = await Patient.findByPk(id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: FamilyMember,
          as: 'familyMembers',
          attributes: { exclude: ['registrationToken'] }
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'The requested patient does not exist'
      });
    }

    // Check if provider can access this patient
    if (req.user.role === 'provider' && patient.providerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own patients'
      });
    }

    logger.logDataAccess('patients', req.user.id, 'view', id);

    res.json({ patient });
  })
);

// POST /api/patients
router.post('/', authorize(['provider', 'admin']), validatePatient, checkValidation, 
  asyncHandler(async (req, res) => {
    const patientData = {
      ...req.body,
      providerId: req.user.id
    };

    const patient = await Patient.create(patientData);

    logger.logUserAction('patient_created', req.user.id, { patientId: patient.id });

    res.status(201).json({
      message: 'Patient created successfully',
      patient
    });
  })
);

// PUT /api/patients/:id
router.put('/:id', authorize(['provider', 'admin']),
  param('id').isUUID().withMessage('Invalid patient ID'),
  validatePatient,
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'The requested patient does not exist'
      });
    }

    // Check if provider can update this patient
    if (req.user.role === 'provider' && patient.providerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own patients'
      });
    }

    const oldValues = patient.toJSON();
    await patient.update(req.body);
    const newValues = patient.toJSON();

    logger.logUserAction('patient_updated', req.user.id, { 
      patientId: patient.id,
      changes: Object.keys(req.body)
    });

    res.json({
      message: 'Patient updated successfully',
      patient
    });
  })
);

// DELETE /api/patients/:id
router.delete('/:id', authorize(['provider', 'admin']),
  param('id').isUUID().withMessage('Invalid patient ID'),
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'The requested patient does not exist'
      });
    }

    // Check if provider can delete this patient
    if (req.user.role === 'provider' && patient.providerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own patients'
      });
    }

    // Soft delete by updating status
    await patient.update({ status: 'inactive' });

    logger.logUserAction('patient_deleted', req.user.id, { patientId: patient.id });

    res.json({
      message: 'Patient deleted successfully'
    });
  })
);

module.exports = router;