module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define('Patient', {
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
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.TEXT
    },
    emergencyContact: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    diagnosis: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dischargeDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    medications: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    treatmentPlan: {
      type: DataTypes.TEXT
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'completed', 'transferred'),
      defaultValue: 'active'
    },
    notes: {
      type: DataTypes.TEXT
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    checklistFrequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'biweekly'),
      defaultValue: 'daily'
    },
    preferredContactTime: {
      type: DataTypes.TIME,
      defaultValue: '09:00:00'
    },
    timeZone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC'
    }
  });

  Patient.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  Patient.prototype.getAge = function() {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  Patient.prototype.getDaysSinceDischarge = function() {
    const today = new Date();
    const discharge = new Date(this.dischargeDate);
    const diffTime = Math.abs(today - discharge);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return Patient;
};