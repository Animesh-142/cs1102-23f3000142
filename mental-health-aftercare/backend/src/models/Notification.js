module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('checklist', 'reminder', 'alert', 'info', 'system'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    channel: {
      type: DataTypes.ENUM('email', 'sms', 'push', 'in_app'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    scheduledAt: {
      type: DataTypes.DATE
    },
    sentAt: {
      type: DataTypes.DATE
    },
    deliveredAt: {
      type: DataTypes.DATE
    },
    patientId: {
      type: DataTypes.UUID,
      references: {
        model: 'Patients',
        key: 'id'
      }
    },
    familyMemberId: {
      type: DataTypes.UUID,
      references: {
        model: 'FamilyMembers',
        key: 'id'
      }
    },
    checklistId: {
      type: DataTypes.UUID,
      references: {
        model: 'Checklists',
        key: 'id'
      }
    },
    recipientEmail: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    recipientPhone: {
      type: DataTypes.STRING
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    errorMessage: {
      type: DataTypes.TEXT
    }
  });

  Notification.prototype.canRetry = function() {
    return this.retryCount < this.maxRetries && 
           ['failed', 'pending'].includes(this.status);
  };

  Notification.prototype.markAsSent = function() {
    this.status = 'sent';
    this.sentAt = new Date();
    return this.save();
  };

  Notification.prototype.markAsDelivered = function() {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
  };

  Notification.prototype.markAsFailed = function(errorMessage) {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    this.retryCount += 1;
    return this.save();
  };

  // Static methods for creating different types of notifications
  Notification.createChecklistNotification = function(familyMember, checklist) {
    return this.create({
      type: 'checklist',
      title: `Daily Checklist for ${checklist.patient?.getFullName()}`,
      message: `Please complete today's checklist for ${checklist.patient?.getFullName()}. Your feedback helps us provide better care.`,
      channel: familyMember.preferredContactMethod === 'email' ? 'email' : 'sms',
      familyMemberId: familyMember.id,
      patientId: checklist.patientId,
      checklistId: checklist.id,
      recipientEmail: familyMember.email,
      recipientPhone: familyMember.phone,
      scheduledAt: new Date()
    });
  };

  Notification.createReminderNotification = function(familyMember, checklist) {
    return this.create({
      type: 'reminder',
      title: `Reminder: Checklist for ${checklist.patient?.getFullName()}`,
      message: `This is a friendly reminder to complete today's checklist for ${checklist.patient?.getFullName()}.`,
      channel: familyMember.preferredContactMethod === 'email' ? 'email' : 'sms',
      familyMemberId: familyMember.id,
      patientId: checklist.patientId,
      checklistId: checklist.id,
      recipientEmail: familyMember.email,
      recipientPhone: familyMember.phone,
      priority: 'high',
      scheduledAt: new Date()
    });
  };

  return Notification;
};