module.exports = (sequelize, DataTypes) => {
  const ChecklistResponse = sequelize.define('ChecklistResponse', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    checklistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Checklists',
        key: 'id'
      }
    },
    familyMemberId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'FamilyMembers',
        key: 'id'
      }
    },
    isComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    timeToComplete: {
      type: DataTypes.INTEGER // in seconds
    },
    deviceInfo: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    ipAddress: {
      type: DataTypes.STRING
    },
    notes: {
      type: DataTypes.TEXT
    }
  });

  ChecklistResponse.prototype.calculateScore = function() {
    const answers = this.answers;
    let totalScore = 0;
    let scoreableQuestions = 0;

    Object.values(answers).forEach(answer => {
      if (typeof answer === 'number') {
        totalScore += answer;
        scoreableQuestions++;
      }
    });

    return scoreableQuestions > 0 ? Math.round((totalScore / scoreableQuestions) * 100) / 100 : 0;
  };

  ChecklistResponse.prototype.flagConcerns = function() {
    const concerns = [];
    const answers = this.answers;

    // Flag low scores (assuming 1-5 scale)
    Object.entries(answers).forEach(([questionId, answer]) => {
      if (typeof answer === 'number' && answer <= 2) {
        concerns.push({
          questionId,
          type: 'low_score',
          value: answer,
          severity: answer === 1 ? 'high' : 'medium'
        });
      }
    });

    // Flag medication non-adherence
    if (answers.medication_adherence === false) {
      concerns.push({
        questionId: 'medication_adherence',
        type: 'medication_missed',
        severity: 'high'
      });
    }

    // Flag concerning behaviors
    if (answers.concerning_behaviors && answers.concerning_behaviors.trim().length > 0) {
      concerns.push({
        questionId: 'concerning_behaviors',
        type: 'concerning_behavior',
        value: answers.concerning_behaviors,
        severity: 'high'
      });
    }

    return concerns;
  };

  return ChecklistResponse;
};