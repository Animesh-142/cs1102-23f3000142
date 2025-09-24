const { Op } = require('sequelize');
const { Patient, ChecklistResponse, Checklist, FamilyMember, sequelize } = require('../models');

class AnalyticsService {
  async getDashboardMetrics(userId, userRole, timeRange) {
    const daysAgo = parseInt(timeRange) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const whereClause = userRole === 'provider' 
      ? { providerId: userId } 
      : {};

    // Get total patients
    const totalPatients = await Patient.count({
      where: { ...whereClause, status: 'active' }
    });

    // Get patients with responses in time range
    const activePatients = await Patient.count({
      where: {
        ...whereClause,
        status: 'active'
      },
      include: [{
        model: Checklist,
        as: 'checklists',
        required: true,
        include: [{
          model: ChecklistResponse,
          as: 'responses',
          required: true,
          where: {
            submittedAt: {
              [Op.gte]: startDate
            }
          }
        }]
      }]
    });

    // Get response statistics
    const responseStats = await this.getResponseStatistics(userId, userRole, daysAgo);

    // Get recent alerts/concerns
    const recentConcerns = await this.getRecentConcerns(userId, userRole, 7);

    // Get completion trends
    const completionTrend = await this.getCompletionTrend(userId, userRole, daysAgo);

    return {
      overview: {
        totalPatients,
        activePatients,
        responseRate: totalPatients > 0 ? Math.round((activePatients / totalPatients) * 100) : 0,
        avgResponseTime: responseStats.avgResponseTime
      },
      responseStats: {
        totalResponses: responseStats.totalResponses,
        completedChecklists: responseStats.completedChecklists,
        overdueChecklists: responseStats.overdueChecklists
      },
      recentConcerns,
      completionTrend,
      timeRange: daysAgo
    };
  }

  async getPatientTrends(patientId, userId, userRole, options = {}) {
    const { timeRange = 30, metrics = [] } = options;
    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Verify access to patient
    const patient = await Patient.findByPk(patientId);
    if (!patient || (userRole === 'provider' && patient.providerId !== userId)) {
      throw new Error('Access denied');
    }

    const responses = await ChecklistResponse.findAll({
      include: [{
        model: Checklist,
        as: 'checklist',
        where: { patientId },
        attributes: ['scheduledDate', 'title']
      }, {
        model: FamilyMember,
        as: 'familyMember',
        attributes: ['firstName', 'lastName', 'relationship']
      }],
      where: {
        submittedAt: {
          [Op.gte]: startDate
        }
      },
      order: [['submittedAt', 'ASC']]
    });

    // Process trends for each metric
    const trends = {};
    metrics.forEach(metric => {
      trends[metric] = this.calculateMetricTrend(responses, metric);
    });

    return {
      patientId,
      timeRange: daysAgo,
      totalResponses: responses.length,
      trends,
      responses: responses.map(r => ({
        date: r.submittedAt,
        answers: r.answers,
        familyMember: r.familyMember?.firstName + ' ' + r.familyMember?.lastName,
        relationship: r.familyMember?.relationship
      }))
    };
  }

  async getResponseRates(userId, userRole, timeRange) {
    const daysAgo = parseInt(timeRange) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const whereClause = userRole === 'provider' 
      ? { providerId: userId } 
      : {};

    // Get daily response rates
    const dailyRates = await sequelize.query(`
      SELECT 
        DATE(c.scheduled_date) as date,
        COUNT(c.id) as total_checklists,
        COUNT(cr.id) as completed_responses,
        ROUND((COUNT(cr.id)::float / COUNT(c.id)) * 100, 2) as completion_rate
      FROM "Checklists" c
      LEFT JOIN "ChecklistResponses" cr ON c.id = cr.checklist_id
      INNER JOIN "Patients" p ON c.patient_id = p.id
      WHERE c.scheduled_date >= :startDate
      ${userRole === 'provider' ? 'AND p.provider_id = :userId' : ''}
      GROUP BY DATE(c.scheduled_date)
      ORDER BY date ASC
    `, {
      replacements: { startDate, userId },
      type: sequelize.QueryTypes.SELECT
    });

    return {
      timeRange: daysAgo,
      dailyRates,
      summary: {
        avgCompletionRate: dailyRates.length > 0 
          ? Math.round(dailyRates.reduce((sum, day) => sum + parseFloat(day.completion_rate), 0) / dailyRates.length)
          : 0,
        totalChecklists: dailyRates.reduce((sum, day) => sum + parseInt(day.total_checklists), 0),
        totalResponses: dailyRates.reduce((sum, day) => sum + parseInt(day.completed_responses), 0)
      }
    };
  }

  async getAlerts(userId, userRole, options = {}) {
    const { status = 'active', page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // For now, we'll simulate alerts based on concerning responses
    // In a real implementation, you'd have a dedicated alerts table
    const concerningResponses = await ChecklistResponse.findAll({
      include: [{
        model: Checklist,
        as: 'checklist',
        include: [{
          model: Patient,
          as: 'patient',
          where: userRole === 'provider' ? { providerId: userId } : {},
          attributes: ['id', 'firstName', 'lastName']
        }]
      }, {
        model: FamilyMember,
        as: 'familyMember',
        attributes: ['firstName', 'lastName', 'relationship']
      }],
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['submittedAt', 'DESC']]
    });

    const alerts = concerningResponses
      .map(response => {
        const concerns = response.flagConcerns();
        return concerns.map(concern => ({
          id: `${response.id}-${concern.questionId}`,
          type: concern.type,
          severity: concern.severity,
          patient: response.checklist.patient,
          familyMember: response.familyMember,
          message: this.generateAlertMessage(concern, response.checklist.patient),
          createdAt: response.submittedAt,
          status: status
        }));
      })
      .flat()
      .filter(alert => alert.severity === 'high' || alert.severity === 'medium');

    return {
      alerts,
      pagination: {
        currentPage: parseInt(page),
        totalCount: alerts.length,
        limit: parseInt(limit)
      }
    };
  }

  async generateReport(userId, userRole, options = {}) {
    const { reportType, patientIds, dateRange, metrics, format } = options;

    // Implement different report types
    switch (reportType) {
      case 'patient_progress':
        return this.generatePatientProgressReport(patientIds, dateRange, metrics, userId, userRole);
      case 'response_summary':
        return this.generateResponseSummaryReport(patientIds, dateRange, userId, userRole);
      case 'trend_analysis':
        return this.generateTrendAnalysisReport(patientIds, dateRange, metrics, userId, userRole);
      default:
        throw new Error('Invalid report type');
    }
  }

  // Helper methods
  async getResponseStatistics(userId, userRole, daysAgo) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const whereClause = userRole === 'provider' 
      ? { providerId: userId } 
      : {};

    const stats = await sequelize.query(`
      SELECT 
        COUNT(cr.id) as total_responses,
        COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_checklists,
        COUNT(CASE WHEN c.status = 'overdue' THEN 1 END) as overdue_checklists,
        AVG(EXTRACT(EPOCH FROM (cr.submitted_at - c.scheduled_date))/3600) as avg_response_time_hours
      FROM "Checklists" c
      LEFT JOIN "ChecklistResponses" cr ON c.id = cr.checklist_id
      INNER JOIN "Patients" p ON c.patient_id = p.id
      WHERE c.scheduled_date >= :startDate
      ${userRole === 'provider' ? 'AND p.provider_id = :userId' : ''}
    `, {
      replacements: { startDate, userId },
      type: sequelize.QueryTypes.SELECT
    });

    return {
      totalResponses: parseInt(stats[0]?.total_responses) || 0,
      completedChecklists: parseInt(stats[0]?.completed_checklists) || 0,
      overdueChecklists: parseInt(stats[0]?.overdue_checklists) || 0,
      avgResponseTime: Math.round((parseFloat(stats[0]?.avg_response_time_hours) || 0) * 100) / 100
    };
  }

  async getRecentConcerns(userId, userRole, days) {
    // Implementation for getting recent concerning responses
    return [];
  }

  async getCompletionTrend(userId, userRole, days) {
    // Implementation for completion trend calculation
    return [];
  }

  calculateMetricTrend(responses, metric) {
    const values = responses
      .map(r => r.answers[metric])
      .filter(v => v !== undefined && v !== null);

    if (values.length === 0) return { average: 0, trend: 'stable', data: [] };

    const average = values.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) / values.length;
    
    // Simple trend calculation
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend = 'stable';
    if (secondAvg > firstAvg * 1.1) trend = 'improving';
    else if (secondAvg < firstAvg * 0.9) trend = 'declining';

    return {
      average: Math.round(average * 100) / 100,
      trend,
      data: values,
      change: Math.round((secondAvg - firstAvg) * 100) / 100
    };
  }

  generateAlertMessage(concern, patient) {
    const patientName = `${patient.firstName} ${patient.lastName}`;
    
    switch (concern.type) {
      case 'low_score':
        return `${patientName} reported a low score (${concern.value}) for ${concern.questionId}`;
      case 'medication_missed':
        return `${patientName} missed medication according to family report`;
      case 'concerning_behavior':
        return `Concerning behavior reported for ${patientName}`;
      default:
        return `Alert for ${patientName}`;
    }
  }

  async generatePatientProgressReport(patientIds, dateRange, metrics, userId, userRole) {
    // Implementation for patient progress report
    return { type: 'patient_progress', data: [], generatedAt: new Date() };
  }

  async generateResponseSummaryReport(patientIds, dateRange, userId, userRole) {
    // Implementation for response summary report
    return { type: 'response_summary', data: [], generatedAt: new Date() };
  }

  async generateTrendAnalysisReport(patientIds, dateRange, metrics, userId, userRole) {
    // Implementation for trend analysis report
    return { type: 'trend_analysis', data: [], generatedAt: new Date() };
  }
}

module.exports = new AnalyticsService();