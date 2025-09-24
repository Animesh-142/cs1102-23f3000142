import { api } from './authService';

class PatientService {
  async getPatients(params = {}) {
    const response = await api.get('/patients', { params });
    return response.data;
  }

  async getPatient(patientId) {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  }

  async createPatient(patientData) {
    const response = await api.post('/patients', patientData);
    return response.data;
  }

  async updatePatient(patientId, patientData) {
    const response = await api.put(`/patients/${patientId}`, patientData);
    return response.data;
  }

  async deletePatient(patientId) {
    const response = await api.delete(`/patients/${patientId}`);
    return response.data;
  }
}

class FamilyMemberService {
  async getFamilyMembers(params = {}) {
    const response = await api.get('/family-members', { params });
    return response.data;
  }

  async getFamilyMember(familyMemberId) {
    const response = await api.get(`/family-members/${familyMemberId}`);
    return response.data;
  }

  async createFamilyMember(familyMemberData) {
    const response = await api.post('/family-members', familyMemberData);
    return response.data;
  }

  async updateFamilyMember(familyMemberId, familyMemberData) {
    const response = await api.put(`/family-members/${familyMemberId}`, familyMemberData);
    return response.data;
  }

  async deleteFamilyMember(familyMemberId) {
    const response = await api.delete(`/family-members/${familyMemberId}`);
    return response.data;
  }
}

class ChecklistService {
  async getChecklists(params = {}) {
    const response = await api.get('/checklists', { params });
    return response.data;
  }

  async getChecklist(checklistId) {
    const response = await api.get(`/checklists/${checklistId}`);
    return response.data;
  }

  async createChecklist(checklistData) {
    const response = await api.post('/checklists', checklistData);
    return response.data;
  }

  async submitChecklistResponse(checklistId, responseData) {
    const response = await api.post(`/checklists/${checklistId}/submit`, responseData);
    return response.data;
  }

  async getChecklistResponses(checklistId) {
    const response = await api.get(`/checklists/${checklistId}/responses`);
    return response.data;
  }
}

class AnalyticsService {
  async getDashboardMetrics(timeRange = '30') {
    const response = await api.get('/analytics/dashboard', {
      params: { timeRange }
    });
    return response.data;
  }

  async getPatientTrends(patientId, params = {}) {
    const response = await api.get(`/analytics/patient/${patientId}/trends`, {
      params
    });
    return response.data;
  }

  async getResponseRates(timeRange = '30') {
    const response = await api.get('/analytics/response-rates', {
      params: { timeRange }
    });
    return response.data;
  }

  async getAlerts(params = {}) {
    const response = await api.get('/analytics/alerts', { params });
    return response.data;
  }

  async generateReport(reportData) {
    const response = await api.post('/analytics/reports/generate', reportData);
    return response.data;
  }
}

class NotificationService {
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data;
  }

  async sendNotification(notificationData) {
    const response = await api.post('/notifications/send', notificationData);
    return response.data;
  }

  async sendBulkNotifications(notifications) {
    const response = await api.post('/notifications/bulk-send', { notifications });
    return response.data;
  }

  async updateNotificationStatus(notificationId, status) {
    const response = await api.put(`/notifications/${notificationId}/status`, { status });
    return response.data;
  }

  async getQueueStats() {
    const response = await api.get('/notifications/queue/stats');
    return response.data;
  }

  async sendTestNotification(channel, recipient) {
    const response = await api.post('/notifications/test', { channel, recipient });
    return response.data;
  }
}

// Export service instances
export const patientService = new PatientService();
export const familyMemberService = new FamilyMemberService();
export const checklistService = new ChecklistService();
export const analyticsService = new AnalyticsService();
export const notificationService = new NotificationService();