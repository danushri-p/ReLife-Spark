import apiClient from './api';

export const uploadService = {
  uploadDamageImages: async (formData) => {
    return await apiClient.post('/diagnosis/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  uploadQuotes: async (formData) => {
    return await apiClient.post('/quotes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default uploadService;

