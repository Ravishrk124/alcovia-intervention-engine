import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

// API endpoints
export const studentAPI = {
    getByEmail: async (email) => {
        const response = await api.get(`/api/student-by-email/${email}`);
        return response.data;
    },

    getStatus: async (studentId) => {
        const response = await api.get(`/api/student-status/${studentId}`);
        return response.data;
    },

    submitCheckin: async (data) => {
        const response = await api.post('/api/daily-checkin', data);
        return response.data;
    },

    completeIntervention: async (data) => {
        const response = await api.post('/api/complete-intervention', data);
        return response.data;
    }
};

export default api;
