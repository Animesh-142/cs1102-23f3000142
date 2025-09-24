module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    entityId: {
      type: DataTypes.UUID
    },
    userId: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    userEmail: {
      type: DataTypes.STRING
    },
    ipAddress: {
      type: DataTypes.STRING
    },
    userAgent: {
      type: DataTypes.TEXT
    },
    oldValues: {
      type: DataTypes.JSONB
    },
    newValues: {
      type: DataTypes.JSONB
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // Static method to log actions
  AuditLog.logAction = async function(action, entityType, entityId, userId, req, oldValues = null, newValues = null) {
    try {
      return await this.create({
        action,
        entityType,
        entityId,
        userId,
        userEmail: req.user?.email,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        oldValues,
        newValues,
        metadata: {
          method: req.method,
          url: req.originalUrl,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
      return null;
    }
  };

  return AuditLog;
};