import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CONFIG } from '../constants/config';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: CONFIG.QUERY_STALE_TIME,
            gcTime: CONFIG.QUERY_GC_TIME,
            refetchOnWindowFocus: true, // Enable for better data freshness
            retry: CONFIG.QUERY_RETRY,
        },
    },
});

export function QueryProvider({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

export default queryClient;
