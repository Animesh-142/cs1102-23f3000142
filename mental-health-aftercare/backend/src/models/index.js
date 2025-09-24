const { Sequelize, DataTypes } = require('sequelize');

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mental_health_aftercare',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'postgres123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const User = require('./User')(sequelize, DataTypes);
const Patient = require('./Patient')(sequelize, DataTypes);
const FamilyMember = require('./FamilyMember')(sequelize, DataTypes);
const Checklist = require('./Checklist')(sequelize, DataTypes);
const ChecklistResponse = require('./ChecklistResponse')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);
const AuditLog = require('./AuditLog')(sequelize, DataTypes);

// Define associations
User.hasMany(Patient, { foreignKey: 'providerId', as: 'patients' });
Patient.belongsTo(User, { foreignKey: 'providerId', as: 'provider' });

Patient.hasMany(FamilyMember, { foreignKey: 'patientId', as: 'familyMembers' });
FamilyMember.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Patient.hasMany(Checklist, { foreignKey: 'patientId', as: 'checklists' });
Checklist.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

FamilyMember.hasMany(ChecklistResponse, { foreignKey: 'familyMemberId', as: 'responses' });
ChecklistResponse.belongsTo(FamilyMember, { foreignKey: 'familyMemberId', as: 'familyMember' });

Checklist.hasMany(ChecklistResponse, { foreignKey: 'checklistId', as: 'responses' });
ChecklistResponse.belongsTo(Checklist, { foreignKey: 'checklistId', as: 'checklist' });

Patient.hasMany(Notification, { foreignKey: 'patientId', as: 'notifications' });
Notification.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

FamilyMember.hasMany(Notification, { foreignKey: 'familyMemberId', as: 'notifications' });
Notification.belongsTo(FamilyMember, { foreignKey: 'familyMemberId', as: 'familyMember' });

// Export models and connection
module.exports = {
  sequelize,
  User,
  Patient,
  FamilyMember,
  Checklist,
  ChecklistResponse,
  Notification,
  AuditLog
};