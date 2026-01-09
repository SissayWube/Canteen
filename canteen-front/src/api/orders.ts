import api from './api';

export interface Order {
    _id: string;
    employee: { name: string; department: string };
    foodItem?: { name: string }; // Optional because foodItem might be null if deleted or code not found, though rare
    price: number;
    subsidy: number;
    currency: string;
    workCode: string;
    status: 'pending' | 'approved' | 'rejected';
    type?: 'manual' | 'automatic';
    timestamp: string;
    ticketPrinted: boolean;
}

export interface OrderFilters {
    from?: string;
    to?: string;
}

export const ordersApi = {
    getAll: async (filters?: OrderFilters) => {
        const params = new URLSearchParams();
        if (filters?.from) params.append('from', filters.from);
        if (filters?.to) params.append('to', filters.to);

        const { data } = await api.get<{ orders: Order[] }>(`/orders?${params.toString()}`);
        return data.orders;
    },

    issueManual: async (data: { employeeId: string; foodItemCode: string }) => {
        const response = await api.post<{ message: string }>('/orders/manual', data);
        return response.data;
    },

    approve: async (orderId: string) => {
        const response = await api.post<{ success: boolean; printed: boolean }>(`/orders/${orderId}/approve`);
        return response.data;
    },

    reject: async (orderId: string) => {
        const response = await api.post<{ success: boolean }>(`/orders/${orderId}/reject`);
        return response.data;
    }
};
