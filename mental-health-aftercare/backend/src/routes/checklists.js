const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { Checklist, ChecklistResponse, Patient, FamilyMember } = require('../models');
const { authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateChecklist = [
  body('patientId')
    .isUUID()
    .withMessage('Please provide a valid patient ID'),
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Please provide a valid scheduled date'),
  body('dueDate')
    .isISO8601()
    .withMessage('Please provide a valid due date')
];

const validateResponse = [
  body('answers')
    .isObject()
    .withMessage('Answers must be an object'),
  body('familyMemberId')
    .isUUID()
    .withMessage('Please provide a valid family member ID')
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

// GET /api/checklists
router.get('/', authorize(['provider', 'admin', 'family_member']), asyncHandler(async (req, res) => {
  const { 
    patientId, 
    status, 
    page = 1, 
    limit = 10,
    familyMemberId 
  } = req.query;
  
  const offset = (page - 1) * limit;
  const where = {};
  const include = [];

  // Filter by patient ID
  if (patientId) {
    where.patientId = patientId;
  }

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Include patient information
  include.push({
    model: Patient,
    as: 'patient',
    attributes: ['id', 'firstName', 'lastName', 'providerId']
  });

  // Include responses if requested
  if (familyMemberId) {
    include.push({
      model: ChecklistResponse,
      as: 'responses',
      where: { familyMemberId },
      required: false,
      include: [{
        model: FamilyMember,
        as: 'familyMember',
        attributes: ['id', 'firstName', 'lastName', 'relationship']
      }]
    });
  }

  // Filter by user role
  if (req.user.role === 'provider') {
    include[0].where = { providerId: req.user.id };
  }

  const { count, rows } = await Checklist.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['scheduledDate', 'DESC']]
  });

  logger.logDataAccess('checklists', req.user.id, 'list');

  res.json({
    checklists: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalCount: count,
      limit: parseInt(limit)
    }
  });
}));

// GET /api/checklists/:id
router.get('/:id', authorize(['provider', 'admin', 'family_member']),
  param('id').isUUID().withMessage('Invalid checklist ID'),
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const checklist = await Checklist.findByPk(id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'providerId']
        },
        {
          model: ChecklistResponse,
          as: 'responses',
          include: [{
            model: FamilyMember,
            as: 'familyMember',
            attributes: ['id', 'firstName', 'lastName', 'relationship']
          }]
        }
      ]
    });

    if (!checklist) {
      return res.status(404).json({
        error: 'Checklist not found',
        message: 'The requested checklist does not exist'
      });
    }

    // Check access permissions
    if (req.user.role === 'provider' && checklist.patient.providerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access checklists for your own patients'
      });
    }

    logger.logDataAccess('checklists', req.user.id, 'view', id);

    res.json({ checklist });
  })
);

// POST /api/checklists
router.post('/', authorize(['provider', 'admin']), validateChecklist, checkValidation,
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
        message: 'You can only create checklists for your own patients'
      });
    }

    // Set default questions if not provided
    const checklistData = {
      ...req.body,
      questions: req.body.questions || Checklist.DEFAULT_QUESTIONS
    };

    const checklist = await Checklist.create(checklistData);

    logger.logUserAction('checklist_created', req.user.id, { 
      checklistId: checklist.id,
      patientId 
    });

    res.status(201).json({
      message: 'Checklist created successfully',
      checklist
    });
  })
);

// POST /api/checklists/:id/submit
router.post('/:id/submit', 
  param('id').isUUID().withMessage('Invalid checklist ID'),
  validateResponse,
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { answers, familyMemberId, notes } = req.body;

    // Find checklist
    const checklist = await Checklist.findByPk(id, {
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!checklist) {
      return res.status(404).json({
        error: 'Checklist not found',
        message: 'The requested checklist does not exist'
      });
    }

    // Verify family member exists and belongs to the patient
    const familyMember = await FamilyMember.findOne({
      where: { 
        id: familyMemberId, 
        patientId: checklist.patientId,
        isActive: true 
      }
    });

    if (!familyMember) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not authorized to submit responses for this patient'
      });
    }

    // Check if already responded
    const existingResponse = await ChecklistResponse.findOne({
      where: { 
        checklistId: id, 
        familyMemberId 
      }
    });

    if (existingResponse) {
      return res.status(409).json({
        error: 'Response already exists',
        message: 'You have already responded to this checklist'
      });
    }

    // Create response
    const response = await ChecklistResponse.create({
      checklistId: id,
      familyMemberId,
      answers,
      notes,
      isComplete: true,
      ipAddress: req.ip,
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      }
    });

    // Update checklist status
    const totalResponses = await ChecklistResponse.count({
      where: { checklistId: id }
    });

    const activeFamilyMembers = await FamilyMember.count({
      where: { patientId: checklist.patientId, isActive: true }
    });

    let newStatus = checklist.status;
    if (totalResponses === activeFamilyMembers) {
      newStatus = 'completed';
      checklist.completedAt = new Date();
    } else if (totalResponses > 0) {
      newStatus = 'partial';
    }

    await checklist.update({ status: newStatus });

    // Flag any concerns
    const concerns = response.flagConcerns();
    if (concerns.length > 0) {
      // Here you would typically create alerts for healthcare providers
      logger.logUserAction('concerns_flagged', familyMember.id, { 
        checklistId: id,
        concerns: concerns.length
      });
    }

    logger.logUserAction('checklist_response_submitted', familyMember.id, { 
      checklistId: id,
      responseId: response.id
    });

    res.status(201).json({
      message: 'Response submitted successfully',
      response,
      concerns
    });
  })
);

// GET /api/checklists/:id/responses
router.get('/:id/responses', authorize(['provider', 'admin']),
  param('id').isUUID().withMessage('Invalid checklist ID'),
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verify checklist exists and user has access
    const checklist = await Checklist.findByPk(id, {
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'providerId']
      }]
    });

    if (!checklist) {
      return res.status(404).json({
        error: 'Checklist not found',
        message: 'The requested checklist does not exist'
      });
    }

    if (req.user.role === 'provider' && checklist.patient.providerId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view responses for your own patients'
      });
    }

    const responses = await ChecklistResponse.findAll({
      where: { checklistId: id },
      include: [{
        model: FamilyMember,
        as: 'familyMember',
        attributes: ['id', 'firstName', 'lastName', 'relationship']
      }],
      order: [['submittedAt', 'DESC']]
    });

    logger.logDataAccess('checklist_responses', req.user.id, 'list', id);

    res.json({ responses });
  })
);

module.exports = router;