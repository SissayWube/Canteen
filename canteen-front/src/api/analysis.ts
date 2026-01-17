import api from './api';

export interface AnalysisOrderRow {
    _id: string;
    timestamp: string;
    customer?: {
        name: string;
        department: string;
    };
    foodItem: {
        name: string;
    };
    operator?: {
        username: string;
    };
    price: number;
    subsidy: number;
    status: string;
    notes?: string;
    isGuest?: boolean;
    guestName?: string;
}

export interface AnalysisFilters {
    from?: string;
    to?: string;
    customerId?: string;
    department?: string;
    itemCode?: string;
    status?: string;
}

export const analysisApi = {
    getOrders: async (filters: AnalysisFilters): Promise<AnalysisOrderRow[]> => {
        const params = new URLSearchParams({ type: 'orders' });

        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);
        if (filters.customerId) params.append('customerId', filters.customerId);
        if (filters.department) params.append('department', filters.department);
        if (filters.itemCode) params.append('itemCode', filters.itemCode);
        if (filters.status) params.append('status', filters.status);

        const { data } = await api.get<AnalysisOrderRow[]>(`/analysis?${params.toString()}`);
        return data;
    }
};
