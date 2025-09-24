const express = require('express');
const { body, validationResult } = require('express-validator');
const { authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateNotification = [
  body('type')
    .isIn(['checklist', 'reminder', 'alert', 'info', 'system'])
    .withMessage('Invalid notification type'),
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('message')
    .isLength({ min: 1 })
    .withMessage('Message is required'),
  body('channel')
    .isIn(['email', 'sms', 'push', 'in_app'])
    .withMessage('Invalid notification channel')
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

// GET /api/notifications
router.get('/', authorize(['provider', 'admin']), asyncHandler(async (req, res) => {
  const { 
    status, 
    type, 
    page = 1, 
    limit = 20,
    patientId 
  } = req.query;

  const notifications = await notificationService.getNotifications(req.user.id, req.user.role, {
    status,
    type,
    patientId,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  logger.logDataAccess('notifications', req.user.id, 'list');

  res.json(notifications);
}));

// POST /api/notifications/send
router.post('/send', authorize(['provider', 'admin']), validateNotification, checkValidation,
  asyncHandler(async (req, res) => {
    const notificationData = {
      ...req.body,
      userId: req.user.id
    };

    const result = await notificationService.sendNotification(notificationData);

    logger.logUserAction('notification_sent', req.user.id, { 
      type: req.body.type,
      channel: req.body.channel
    });

    res.status(201).json({
      message: 'Notification sent successfully',
      result
    });
  })
);

// POST /api/notifications/bulk-send
router.post('/bulk-send', authorize(['provider', 'admin']), 
  body('notifications').isArray().withMessage('Notifications must be an array'),
  checkValidation,
  asyncHandler(async (req, res) => {
    const { notifications } = req.body;

    const results = await notificationService.sendBulkNotifications(
      notifications.map(n => ({ ...n, userId: req.user.id }))
    );

    logger.logUserAction('bulk_notifications_sent', req.user.id, { 
      count: notifications.length 
    });

    res.status(201).json({
      message: 'Bulk notifications processed',
      results
    });
  })
);

// PUT /api/notifications/:id/status
router.put('/:id/status', authorize(['provider', 'admin']),
  body('status')
    .isIn(['pending', 'sent', 'delivered', 'failed', 'cancelled'])
    .withMessage('Invalid status'),
  checkValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await notificationService.updateNotificationStatus(id, status, req.user.id);

    if (!result) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'The requested notification does not exist'
      });
    }

    logger.logUserAction('notification_status_updated', req.user.id, { 
      notificationId: id,
      newStatus: status
    });

    res.json({
      message: 'Notification status updated successfully',
      notification: result
    });
  })
);

// GET /api/notifications/queue/stats
router.get('/queue/stats', authorize(['admin']), asyncHandler(async (req, res) => {
  const stats = await notificationService.getQueueStats();

  logger.logDataAccess('notifications', req.user.id, 'queue_stats');

  res.json(stats);
}));

// POST /api/notifications/test
router.post('/test', authorize(['admin']), 
  body('channel').isIn(['email', 'sms']).withMessage('Invalid test channel'),
  body('recipient').notEmpty().withMessage('Recipient is required'),
  checkValidation,
  asyncHandler(async (req, res) => {
    const { channel, recipient } = req.body;

    const result = await notificationService.sendTestNotification(channel, recipient);

    logger.logUserAction('test_notification_sent', req.user.id, { 
      channel, 
      recipient: '[REDACTED]'
    });

    res.json({
      message: 'Test notification sent',
      result
    });
  })
);

module.exports = router;