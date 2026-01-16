import api from './api';

export interface User {
    _id: string;
    username: string;
    fullName?: string;
    role: 'admin' | 'operator';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserFilters {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'admin' | 'operator';
    isActive?: boolean;
}

export interface UserResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export const usersApi = {
    getAll: async (filters?: UserFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.role) params.append('role', filters.role);
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

        const { data } = await api.get<UserResponse>(`/users?${params.toString()}`);
        return data;
    },

    create: async (user: { username: string; fullName?: string; password: string; role?: 'admin' | 'operator' }) => {
        const { data } = await api.post('/users', user);
        return data;
    },

    update: async (id: string, user: { username?: string; fullName?: string; password?: string; role?: 'admin' | 'operator' }) => {
        const { data } = await api.put(`/users/${id}`, user);
        return data;
    },

    toggleActive: async (id: string, isActive: boolean) => {
        const { data } = await api.put(`/users/${id}`, { isActive });
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/users/${id}`);
        return data;
    }
};
