import apiClient from './api';

export const repairService = {
  analyzeDecision: (payload) => apiClient.post('/repair/analyze', payload),
  /** Typical repair price, new-phone price and shop questions for a device + fault (AI, may take ~20s). */
  estimate: (payload) => apiClient.post('/repair/estimate', payload, { timeout: 90000 }),
};

export default repairService;
