import api from './api';

export interface Customer {
    _id: string;
    deviceId: string;
    name: string;
    department: string;
    isActive: boolean;
    enrolledAt: string; // ISO date string
}

export const customersApi = {
    getAll: async () => {
        const { data } = await api.get<Customer[]>('/customers');
        return data;
    },

    create: async (customer: Omit<Customer, '_id' | 'isActive' | 'enrolledAt'>) => {
        const { data } = await api.post('/customers', customer);
        return data;
    },

    update: async (id: string, customer: Partial<Customer>) => {
        const { data } = await api.put(`/customers/${id}`, customer);
        return data;
    },

    toggleActive: async (id: string, isActive: boolean) => {
        const { data } = await api.put(`/customers/${id}`, { isActive });
        return data;
    }
};
