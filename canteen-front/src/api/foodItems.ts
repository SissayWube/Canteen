import api from './api';

export interface FoodItem {
    _id: string;
    code: string;
    name: string;
    description?: string;
    price: number;
    subsidy: number;
    currency: string;
    availableDays?: string[];
    isActive: boolean;
}

export interface FoodItemFilters {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}

export interface FoodItemResponse {
    foodItems: FoodItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export const foodItemsApi = {
    getAll: async (filters?: FoodItemFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

        const { data } = await api.get<FoodItemResponse>(`/food-items?${params.toString()}`);
        return data;
    },

    create: async (foodItem: Omit<FoodItem, '_id' | 'isActive'>) => {
        const { data } = await api.post('/food-items', foodItem);
        return data;
    },

    update: async (id: string, foodItem: Partial<FoodItem>) => {
        const { data } = await api.put(`/food-items/${id}`, foodItem);
        return data;
    },

    toggleActive: async (id: string, isActive: boolean) => {
        const { data } = await api.put(`/food-items/${id}`, { isActive });
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/food-items/${id}`);
        return data;
    }
};
