module.exports = (sequelize, DataTypes) => {
  const Checklist = sequelize.define('Checklist', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'partial', 'completed', 'overdue'),
      defaultValue: 'pending'
    },
    type: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'custom'),
      defaultValue: 'daily'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Patients',
        key: 'id'
      }
    },
    sentAt: {
      type: DataTypes.DATE
    },
    completedAt: {
      type: DataTypes.DATE
    },
    reminders: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    templateId: {
      type: DataTypes.UUID,
      references: {
        model: 'Checklists',
        key: 'id'
      }
    }
  });

  // Default questions for daily checklist
  Checklist.DEFAULT_QUESTIONS = [
    {
      id: 'sleep_quality',
      question: 'How well did the patient sleep last night?',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
      required: true
    },
    {
      id: 'medication_adherence',
      question: 'Did the patient take their medications as prescribed?',
      type: 'boolean',
      required: true
    },
    {
      id: 'outdoor_activity',
      question: 'Did the patient engage in any outdoor activities (walk, exercise, etc.)?',
      type: 'boolean',
      required: true
    },
    {
      id: 'mood_assessment',
      question: 'How would you describe the patient\'s overall mood today?',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good'] },
      required: true
    },
    {
      id: 'appetite',
      question: 'How was the patient\'s appetite today?',
      type: 'scale',
      scale: { min: 1, max: 5, labels: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
      required: true
    },
    {
      id: 'social_interaction',
      question: 'Did the patient interact with family or friends today?',
      type: 'boolean',
      required: false
    },
    {
      id: 'concerning_behaviors',
      question: 'Did you notice any concerning behaviors or changes?',
      type: 'text',
      required: false
    },
    {
      id: 'general_notes',
      question: 'Any additional observations or comments?',
      type: 'text',
      required: false
    }
  ];

  Checklist.prototype.isOverdue = function() {
    return new Date() > new Date(this.dueDate) && this.status !== 'completed';
  };

  Checklist.prototype.getCompletionRate = function() {
    if (!this.responses || this.responses.length === 0) return 0;
    const totalQuestions = this.questions.length;
    const answeredQuestions = this.responses.reduce((count, response) => {
      return count + Object.keys(response.answers).length;
    }, 0);
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  return Checklist;
};