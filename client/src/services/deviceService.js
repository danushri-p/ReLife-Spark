import apiClient from './api';

export const deviceService = {
  createDevice: async (deviceData) => {
    return await apiClient.post('/devices', deviceData);
  },
  getDeviceById: async (id) => {
    return await apiClient.get(`/devices/${id}`);
  },
};

export default deviceService;

