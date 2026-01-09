import api from './api';

export interface User {
    username: string;
    role: 'admin' | 'operator';
    fullName?: string;
}

interface AuthResponse {
    user: User;
    message?: string;
}

export const authApi = {
    login: async (username: string, password: string): Promise<User> => {
        const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
        return data.user;
    },

    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
    },

    getCurrentUser: async (): Promise<User> => {
        const { data } = await api.get<AuthResponse>('/auth/me');
        return data.user;
    }
};
