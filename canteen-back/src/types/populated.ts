import mongoose from 'mongoose';
import { IOrder } from '../models/Order';

/**
 * Type-safe interfaces for populated Mongoose documents
 * Use these instead of 'any' type assertions when querying with .populate()
 */

export interface PopulatedCustomer {
    _id: mongoose.Types.ObjectId;
    name: string;
    deviceId: string;
    department: string;
    isActive: boolean;
}

export interface PopulatedFoodItem {
    _id: mongoose.Types.ObjectId;
    name: string;
    code: string;
    price: number;
    subsidy: number;
    currency: string;
    isActive: boolean;
}

export interface PopulatedOperator {
    _id: mongoose.Types.ObjectId;
    username: string;
    fullName?: string;
    role: 'admin' | 'operator';
}

/**
 * Order document with populated references
 * Use this type when you've called .populate() on an Order query
 */
export interface PopulatedOrder extends Omit<IOrder, 'customer' | 'foodItem' | 'operator'> {
    customer: PopulatedCustomer;
    foodItem: PopulatedFoodItem;
    operator?: PopulatedOperator;
}

/**
 * Type guard to check if order has populated customer
 */
export function hasPopulatedCustomer(order: any): order is PopulatedOrder {
    return order.customer != null && typeof order.customer.name === 'string';
}

/**
 * Type guard to check if order has populated food item
 */
export function hasPopulatedFoodItem(order: any): order is PopulatedOrder {
    return order.foodItem != null && typeof order.foodItem.name === 'string';
}
