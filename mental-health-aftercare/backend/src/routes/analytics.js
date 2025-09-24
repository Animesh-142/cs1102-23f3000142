const express = require('express');
const { authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/analytics/dashboard
router.get('/dashboard', authorize(['provider', 'admin']), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { timeRange = '30' } = req.query; // days

  const dashboardData = await analyticsService.getDashboardMetrics(userId, req.user.role, timeRange);

  logger.logDataAccess('analytics', userId, 'dashboard_view');

  res.json(dashboardData);
}));

// GET /api/analytics/patient/:patientId/trends
router.get('/patient/:patientId/trends', authorize(['provider', 'admin']), asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { timeRange = '30', metrics } = req.query;

  const trends = await analyticsService.getPatientTrends(patientId, req.user.id, req.user.role, {
    timeRange,
    metrics: metrics ? metrics.split(',') : ['sleep_quality', 'mood_assessment', 'medication_adherence']
  });

  logger.logDataAccess('analytics', req.user.id, 'patient_trends', patientId);

  res.json(trends);
}));

// GET /api/analytics/response-rates
router.get('/response-rates', authorize(['provider', 'admin']), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { timeRange = '30' } = req.query;

  const responseRates = await analyticsService.getResponseRates(userId, req.user.role, timeRange);

  logger.logDataAccess('analytics', userId, 'response_rates');

  res.json(responseRates);
}));

// GET /api/analytics/alerts
router.get('/alerts', authorize(['provider', 'admin']), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status = 'active', page = 1, limit = 20 } = req.query;

  const alerts = await analyticsService.getAlerts(userId, req.user.role, {
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  logger.logDataAccess('analytics', userId, 'alerts_view');

  res.json(alerts);
}));

// POST /api/analytics/reports/generate
router.post('/reports/generate', authorize(['provider', 'admin']), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    reportType, 
    patientIds, 
    dateRange, 
    metrics,
    format = 'json'
  } = req.body;

  const report = await analyticsService.generateReport(userId, req.user.role, {
    reportType,
    patientIds,
    dateRange,
    metrics,
    format
  });

  logger.logUserAction('report_generated', userId, { 
    reportType, 
    patientCount: patientIds?.length || 0 
  });

  res.json(report);
}));

module.exports = router;