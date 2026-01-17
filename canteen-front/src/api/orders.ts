import api from './api';

export interface Order {
    _id: string;
    customer: { _id: string; name: string; department: string; deviceId?: string };
    foodItem?: { name: string; currency?: string; price?: number; subsidy?: number };
    price: number;
    subsidy: number;
    currency: string;
    workCode: string;
    status: 'pending' | 'approved' | 'rejected';
    type?: 'manual' | 'automatic';
    timestamp: string;
    ticketPrinted: boolean;
    isGuest?: boolean;
    guestName?: string;
    notes?: string;
}

export interface OrderFilters {
    from?: string;
    to?: string;
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    limit?: number;
    customerId?: string;
    department?: string;
    search?: string;
}

export const ordersApi = {
    getAll: async (filters?: OrderFilters) => {
        const params = new URLSearchParams();
        if (filters?.from) params.append('from', filters.from);
        if (filters?.to) params.append('to', filters.to);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.customerId) params.append('customerId', filters.customerId);
        if (filters?.department) params.append('department', filters.department);
        if (filters?.search) params.append('search', filters.search);

        const { data } = await api.get<{ orders: Order[], pagination: { page: number, limit: number, total: number, pages: number } }>(`/orders?${params.toString()}`);
        return data;
    },

    getStats: async () => {
        const { data } = await api.get<{ total: number, approved: number, pending: number, rejected: number }>('/orders/stats');
        return data;
    },

    issueManual: async (data: {
        customerId?: string;
        foodItemCode: string;
        isGuest?: boolean;
        guestName?: string;
        notes?: string;
    }) => {
        const response = await api.post<{ message: string }>('/orders/manual', data);
        return response.data;
    },

    approve: async (orderId: string) => {
        const response = await api.post<{ success: boolean; printed: boolean }>(`/orders/${orderId}/approve`);
        return response.data;
    },

    reject: async (orderId: string, reason?: string) => {
        const response = await api.post<{ success: boolean }>(`/orders/${orderId}/reject`, { reason });
        return response.data;
    },

    update: async (orderId: string, data: Partial<{
        customerId: string;
        foodItemCode: string | number;
        isGuest: boolean;
        guestName: string;
        notes: string;
    }>) => {
        const response = await api.put<{ success: boolean; order: Order }>(`/orders/${orderId}`, data);
        return response.data;
    }
};
