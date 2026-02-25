import api from './api';

export interface Department {
    _id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export const departmentsApi = {
    getAll: async () => {
        const { data } = await api.get<Department[]>('/departments');
        return data;
    },

    create: async (department: Pick<Department, 'name' | 'description'>) => {
        const { data } = await api.post<Department>('/departments', department);
        return data;
    },

    update: async (id: string, department: Partial<Pick<Department, 'name' | 'description'>>) => {
        const { data } = await api.put<Department>(`/departments/${id}`, department);
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/departments/${id}`);
        return data;
    },
};
