import api from './api';

export interface Employee {
    _id: string;
    deviceId: string;
    name: string;
    department: string;
    isActive: boolean;
    enrolledAt: string; // ISO date string
}

export const employeesApi = {
    getAll: async () => {
        const { data } = await api.get<Employee[]>('/employees');
        return data;
    },

    create: async (employee: Omit<Employee, '_id' | 'isActive' | 'enrolledAt'>) => {
        const { data } = await api.post('/employees', employee);
        return data;
    },

    update: async (id: string, employee: Partial<Employee>) => {
        const { data } = await api.put(`/employees/${id}`, employee);
        return data;
    },

    toggleActive: async (id: string, isActive: boolean) => {
        const { data } = await api.put(`/employees/${id}`, { isActive });
        return data;
    }
};
