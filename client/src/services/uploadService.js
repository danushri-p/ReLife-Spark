import apiClient from './api';

// AI analysis of photos and quotes can take a while, so these calls get a longer timeout.
const AI_TIMEOUT_MS = 90000;

export const uploadService = {
  uploadDamageImages: (formData) =>
    apiClient.post('/diagnosis/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: AI_TIMEOUT_MS,
    }),

  uploadQuotes: (formData) =>
    apiClient.post('/quotes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: AI_TIMEOUT_MS,
    }),
};

export default uploadService;
