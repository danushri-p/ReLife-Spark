import apiClient from './api';

export const repairService = {
    analyzeDecision: async (payload) => {
        return await apiClient.post('/repair/analyze', payload);
    },
};

export default repairService;
