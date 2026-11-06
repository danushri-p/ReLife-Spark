import apiClient from './api';

export const repairService = {
  analyzeDecision: (payload) => apiClient.post('/repair/analyze', payload),
  /** Typical repair price, new-phone price and shop questions for a device + fault (AI, may take ~20s). */
  estimate: (payload) => apiClient.post('/repair/estimate', payload, { timeout: 90000 }),
  /** Why this verdict, explained from the repair guides with sources (AI, falls back to the guides). */
  explain: (payload) => apiClient.post('/repair/explain', payload, { timeout: 60000 }),
};

export default repairService;
