const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { Notification, Patient, FamilyMember } = require('../models');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.initializeServices();
  }

  initializeServices() {
    // Initialize email service
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      // Verify email configuration
      this.emailTransporter.verify((error, success) => {
        if (error) {
          logger.error('Email configuration error:', error);
        } else {
          logger.info('Email service ready');
        }
      });
    }

    // Initialize SMS service
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  async sendNotification(notificationData) {
    const {
      type,
      title,
      message,
      channel,
      priority = 'medium',
      patientId,
      familyMemberId,
      checklistId,
      recipientEmail,
      recipientPhone,
      scheduledAt
    } = notificationData;

    try {
      // Create notification record
      const notification = await Notification.create({
        type,
        title,
        message,
        channel,
        priority,
        patientId,
        familyMemberId,
        checklistId,
        recipientEmail,
        recipientPhone,
        scheduledAt: scheduledAt || new Date(),
        status: 'pending'
      });

      // Send immediately if not scheduled for future
      if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
        await this.processNotification(notification);
      }

      return {
        id: notification.id,
        status: notification.status,
        scheduledAt: notification.scheduledAt
      };
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  async sendBulkNotifications(notifications) {
    const results = [];
    
    for (const notificationData of notifications) {
      try {
        const result = await this.sendNotification(notificationData);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  async processNotification(notification) {
    try {
      switch (notification.channel) {
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'push':
          await this.sendPushNotification(notification);
          break;
        case 'in_app':
          await this.sendInAppNotification(notification);
          break;
        default:
          throw new Error(`Unsupported notification channel: ${notification.channel}`);
      }

      await notification.markAsSent();
      logger.info('Notification sent successfully', { id: notification.id, channel: notification.channel });
    } catch (error) {
      await notification.markAsFailed(error.message);
      logger.error('Failed to send notification:', error, { id: notification.id });
      
      // Retry if possible
      if (notification.canRetry()) {
        logger.info('Scheduling notification retry', { id: notification.id, retryCount: notification.retryCount + 1 });
        // In a real implementation, you'd add this to a retry queue
      }
    }
  }

  async sendEmail(notification) {
    if (!this.emailTransporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: notification.recipientEmail,
      subject: notification.title,
      html: await this.generateEmailTemplate(notification)
    };

    const result = await this.emailTransporter.sendMail(mailOptions);
    
    // Update notification with delivery info
    notification.metadata = { 
      ...notification.metadata, 
      messageId: result.messageId,
      response: result.response 
    };
    await notification.save();

    return result;
  }

  async sendSMS(notification) {
    if (!this.twilioClient) {
      throw new Error('SMS service not configured');
    }

    const message = await this.twilioClient.messages.create({
      body: `${notification.title}\n\n${notification.message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: notification.recipientPhone
    });

    // Update notification with delivery info
    notification.metadata = { 
      ...notification.metadata, 
      messageSid: message.sid,
      status: message.status 
    };
    await notification.save();

    return message;
  }

  async sendPushNotification(notification) {
    // Implement push notification logic (e.g., Firebase Cloud Messaging)
    // For now, just mark as sent
    logger.info('Push notification sent (simulated)', { id: notification.id });
    return { success: true };
  }

  async sendInAppNotification(notification) {
    // In-app notifications are just database records
    // Real-time delivery would typically use WebSockets
    logger.info('In-app notification created', { id: notification.id });
    return { success: true };
  }

  async generateEmailTemplate(notification) {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #667eea; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🏥 Mental Health Aftercare</h1>
              </div>
              <div class="content">
                  <h2>${notification.title}</h2>
                  <p>${notification.message}</p>
                  ${await this.generateNotificationSpecificContent(notification)}
              </div>
              <div class="footer">
                  <p>This message was sent from the Mental Health Aftercare System.</p>
                  <p>If you have questions, please contact your healthcare provider.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    return baseTemplate;
  }

  async generateNotificationSpecificContent(notification) {
    switch (notification.type) {
      case 'checklist':
        return this.generateChecklistContent(notification);
      case 'reminder':
        return this.generateReminderContent(notification);
      case 'alert':
        return this.generateAlertContent(notification);
      default:
        return '';
    }
  }

  async generateChecklistContent(notification) {
    if (!notification.checklistId) return '';

    const checklistUrl = `${process.env.FRONTEND_URL}/checklist/${notification.checklistId}`;
    
    return `
      <p>Please take a few minutes to complete today's checklist. Your feedback helps us provide better care.</p>
      <p style="text-align: center; margin: 20px 0;">
          <a href="${checklistUrl}" class="button">Complete Checklist</a>
      </p>
      <p><strong>What to expect:</strong></p>
      <ul>
          <li>8-10 simple questions about daily activities</li>
          <li>Takes 2-3 minutes to complete</li>
          <li>All information is confidential and secure</li>
      </ul>
    `;
  }

  async generateReminderContent(notification) {
    return `
      <p>This is a friendly reminder that you have a pending checklist to complete.</p>
      <p>Your continued participation helps ensure the best possible care for your family member.</p>
    `;
  }

  async generateAlertContent(notification) {
    return `
      <p><strong>⚠️ This is an important notification regarding patient care.</strong></p>
      <p>Please review the information carefully and contact the healthcare provider if you have any concerns.</p>
    `;
  }

  async getNotifications(userId, userRole, options = {}) {
    const { status, type, patientId, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    const where = {};
    const include = [];

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Filter by patient
    if (patientId) {
      where.patientId = patientId;
    }

    // Add patient include for access control
    if (userRole === 'provider') {
      include.push({
        model: Patient,
        as: 'patient',
        where: { providerId: userId },
        attributes: ['id', 'firstName', 'lastName']
      });
    } else {
      include.push({
        model: Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName'],
        required: false
      });
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return {
      notifications: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalCount: count,
        limit: parseInt(limit)
      }
    };
  }

  async updateNotificationStatus(notificationId, status, userId) {
    const notification = await Notification.findByPk(notificationId);
    
    if (!notification) {
      return null;
    }

    // Check access permissions
    if (notification.patientId) {
      const patient = await Patient.findByPk(notification.patientId);
      if (patient && patient.providerId !== userId) {
        throw new Error('Access denied');
      }
    }

    await notification.update({ status });
    return notification;
  }

  async getQueueStats() {
    const stats = await Notification.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status']
    });

    const result = {
      pending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      result[stat.status] = parseInt(stat.dataValues.count);
    });

    return result;
  }

  async sendTestNotification(channel, recipient) {
    const testNotification = {
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test message from the Mental Health Aftercare System.',
      channel,
      priority: 'low'
    };

    if (channel === 'email') {
      testNotification.recipientEmail = recipient;
    } else if (channel === 'sms') {
      testNotification.recipientPhone = recipient;
    }

    return this.sendNotification(testNotification);
  }

  // Cron job methods for scheduled sending
  async processScheduledNotifications() {
    const now = new Date();
    const scheduledNotifications = await Notification.findAll({
      where: {
        status: 'pending',
        scheduledAt: {
          [require('sequelize').Op.lte]: now
        }
      },
      limit: 100 // Process in batches
    });

    for (const notification of scheduledNotifications) {
      await this.processNotification(notification);
    }

    return scheduledNotifications.length;
  }

  async sendDailyChecklists() {
    // This would be called by a cron job to send daily checklists
    const today = new Date();
    const patients = await Patient.findAll({
      where: { 
        status: 'active',
        checklistFrequency: 'daily'
      },
      include: [{
        model: FamilyMember,
        as: 'familyMembers',
        where: { isActive: true }
      }]
    });

    const notifications = [];
    
    for (const patient of patients) {
      // Create daily checklist
      const { Checklist } = require('../models');
      const checklist = await Checklist.create({
        title: `Daily Checklist for ${patient.getFullName()}`,
        description: `Please complete today's wellness checklist for ${patient.getFullName()}`,
        questions: Checklist.DEFAULT_QUESTIONS,
        scheduledDate: today,
        dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Due in 24 hours
        patientId: patient.id,
        type: 'daily'
      });

      // Send notification to all active family members
      for (const familyMember of patient.familyMembers) {
        const notification = await Notification.createChecklistNotification(familyMember, {
          ...checklist.toJSON(),
          patient
        });
        notifications.push(notification);
      }
    }

    // Process all notifications
    for (const notification of notifications) {
      await this.processNotification(notification);
    }

    return notifications.length;
  }
}

module.exports = new NotificationService();