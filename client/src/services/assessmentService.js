import apiClient from './api';

export const assessmentService = {
  list: (userId, params = {}) => apiClient.get('/assessments', { params: { userId, ...params } }),
  get: (id) => apiClient.get(`/assessments/${id}`),
  create: (data) => apiClient.post('/assessments', data),
  update: (id, data) => apiClient.patch(`/assessments/${id}`, data),
  remove: (id) => apiClient.delete(`/assessments/${id}`),
  stats: (userId) => apiClient.get('/assessments/stats', { params: { userId } }),
};

/** sessionStorage key holding the id of the case the user is working on. */
export const CURRENT_CASE_KEY = 'relife-spark:current-case';

export default assessmentService;
