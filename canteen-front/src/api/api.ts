import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for sending cookies
    headers: {
        'Content-Type': 'application/json',
    },
});



export const registerLogoutCallback = (callback: () => void) => {
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                callback();
            }
            return Promise.reject(error);
        }
    );
};

export default api;