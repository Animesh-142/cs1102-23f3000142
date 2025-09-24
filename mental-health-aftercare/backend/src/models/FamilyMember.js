module.exports = (sequelize, DataTypes) => {
  const FamilyMember = sequelize.define('FamilyMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    relationship: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/
      }
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    preferredContactMethod: {
      type: DataTypes.ENUM('email', 'sms', 'both'),
      defaultValue: 'both'
    },
    timeZone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC'
    },
    preferredContactTime: {
      type: DataTypes.TIME,
      defaultValue: '09:00:00'
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'en'
    },
    notes: {
      type: DataTypes.TEXT
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Patients',
        key: 'id'
      }
    },
    registrationToken: {
      type: DataTypes.STRING,
      unique: true
    },
    isRegistered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastActiveAt: {
      type: DataTypes.DATE
    }
  });

  FamilyMember.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  FamilyMember.prototype.generateRegistrationToken = function() {
    const crypto = require('crypto');
    this.registrationToken = crypto.randomBytes(32).toString('hex');
    return this.registrationToken;
  };

  return FamilyMember;
};