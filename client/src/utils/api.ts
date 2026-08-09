import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Interceptor to inject JWT Token on requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('vionix_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
