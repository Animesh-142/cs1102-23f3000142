const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { FamilyMember, Patient } = require('../models');
const { authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateFamilyMember = [
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('relationship')
    .isLength({ min: 1, max: 50 })
    .withMessage('Relationship is required and must be less than 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('patientId')
    .isUUID()
    .withMessage('Please provide a valid patient ID')
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

// GET /api/family-members
router.get('/', authorize(['provider', 'admin']), asyncHandler(async (req, res) => {
  const { patientId, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (patientId) {
    where.patientId = patientId;
  }

  const { count, rows } = await FamilyMember.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      {
        model: Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName'],
        include: req.user.role === 'provider' ? [{
          model: require('../models').User,
          as: 'provider',
          where: { id: req.user.id },
          attributes: []
        }] : []
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  logger.logDataAccess('family_members', req.user.id, 'list');

  res.json({
    familyMembers: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalCount: count,
      limit: parseInt(limit)
    }
  });
}));

// GET /api/family-members/:id
router.get('/:id', authorize(['provider', 'admin']),
  param('id').isUUID().withMessage('Invalid family member ID'),
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const familyMember = await FamilyMember.findByPk(id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'providerId']
        }
      ]
    });

    if (!familyMember) {
      return res.status(404).json({
        error: 'Family member not found',
        message: 'The requested family member does not exist'
      });
    }

    // Check if provider can access this family member
    if (req.user.role === 'provider' && familyMember.patient.providerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access family members of your own patients'
      });
    }

    logger.logDataAccess('family_members', req.user.id, 'view', id);

    res.json({ familyMember });
  })
);

// POST /api/family-members
router.post('/', authorize(['provider', 'admin']), validateFamilyMember, checkValidation,
  asyncHandler(async (req, res) => {
    const { patientId } = req.body;

    // Verify patient exists and belongs to the provider
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'The specified patient does not exist'
      });
    }

    if (req.user.role === 'provider' && patient.providerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only add family members to your own patients'
      });
    }

    // If this is set as primary, unset other primary family members
    if (req.body.isPrimary) {
      await FamilyMember.update(
        { isPrimary: false },
        { where: { patientId, isPrimary: true } }
      );
    }

    const familyMember = await FamilyMember.create(req.body);

    // Generate registration token
    familyMember.generateRegistrationToken();
    await familyMember.save();

    logger.logUserAction('family_member_created', req.user.id, { 
      familyMemberId: familyMember.id,
      patientId 
    });

    res.status(201).json({
      message: 'Family member added successfully',
      familyMember
    });
  })
);

// PUT /api/family-members/:id
router.put('/:id', authorize(['provider', 'admin']),
  param('id').isUUID().withMessage('Invalid family member ID'),
  validateFamilyMember,
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const familyMember = await FamilyMember.findByPk(id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'providerId']
        }
      ]
    });

    if (!familyMember) {
      return res.status(404).json({
        error: 'Family member not found',
        message: 'The requested family member does not exist'
      });
    }

    // Check if provider can update this family member
    if (req.user.role === 'provider' && familyMember.patient.providerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update family members of your own patients'
      });
    }

    // If this is set as primary, unset other primary family members
    if (req.body.isPrimary && !familyMember.isPrimary) {
      await FamilyMember.update(
        { isPrimary: false },
        { where: { patientId: familyMember.patientId, isPrimary: true } }
      );
    }

    await familyMember.update(req.body);

    logger.logUserAction('family_member_updated', req.user.id, { 
      familyMemberId: familyMember.id,
      changes: Object.keys(req.body)
    });

    res.json({
      message: 'Family member updated successfully',
      familyMember
    });
  })
);

// DELETE /api/family-members/:id
router.delete('/:id', authorize(['provider', 'admin']),
  param('id').isUUID().withMessage('Invalid family member ID'),
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const familyMember = await FamilyMember.findByPk(id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'providerId']
        }
      ]
    });

    if (!familyMember) {
      return res.status(404).json({
        error: 'Family member not found',
        message: 'The requested family member does not exist'
      });
    }

    // Check if provider can delete this family member
    if (req.user.role === 'provider' && familyMember.patient.providerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete family members of your own patients'
      });
    }

    await familyMember.update({ isActive: false });

    logger.logUserAction('family_member_deleted', req.user.id, { 
      familyMemberId: familyMember.id 
    });

    res.json({
      message: 'Family member removed successfully'
    });
  })
);

module.exports = router;