import api from './api';

export interface Customer {
    _id: string;
    deviceId: string;
    name: string;
    department: string;
    isActive: boolean;
    enrolledAt: string; // ISO date string
}

export interface CustomerFilters {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    isActive?: boolean;
}

export interface CustomerResponse {
    customers: Customer[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export const customersApi = {
    getAll: async (filters?: CustomerFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.department) params.append('department', filters.department);
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

        const { data } = await api.get<CustomerResponse>(`/customers?${params.toString()}`);
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
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/customers/hard/${id}`);
        return data;
    },

    bulkCreate: async (customers: Omit<Customer, '_id' | 'isActive' | 'enrolledAt'>[]) => {
        const { data } = await api.post<{ message: string; count: number; skippedCount: number; skipped: string[] }>('/customers/bulk', customers);
        return data;
    }
};
