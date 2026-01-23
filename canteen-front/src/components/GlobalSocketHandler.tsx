import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '../contexts/SocketContext';

/**
 * GlobalSocketHandler
 * 
 * This component listens for socket events in the background and invalidates 
 * relevant React Query caches. This ensures that even if the user is not 
 * currently on the Dashboard, the data is updated so it's fresh when they return.
 */
const GlobalSocketHandler: React.FC = () => {
    const queryClient = useQueryClient();

    // Handler to invalidate order-related queries
    const invalidateOrderData = () => {
        // Invalidate all orders, stats, and analysis data
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orderStats'] });
        queryClient.invalidateQueries({ queryKey: ['analysis'] });
    };

    // Listen to various order-related events
    useSocketEvent('newPendingOrder', () => {
        console.log('Socket event: newPendingOrder - invalidating queries');
        invalidateOrderData();
    });

    useSocketEvent('orderApproved', () => {
        console.log('Socket event: orderApproved - invalidating queries');
        invalidateOrderData();
    });

    useSocketEvent('orderRejected', () => {
        console.log('Socket event: orderRejected - invalidating queries');
        invalidateOrderData();
    });

    // This component doesn't render anything
    return null;
};

export default GlobalSocketHandler;
