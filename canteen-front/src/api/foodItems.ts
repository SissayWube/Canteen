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

export const foodItemsApi = {
    getAll: async () => {
        const { data } = await api.get<FoodItem[]>('/food-items');
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
    }
};
