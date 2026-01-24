import { ReactNode, createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const backendUrl =
            import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

        const socketInstance = io(backendUrl, {
            transports: ['websocket', 'polling'],
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
}

// Helper hook to listen to socket events
// Fixed: Memoize handler to prevent recreation on every render
export function useSocketEvent<T = any>(
    eventName: string,
    handler: (data: T) => void
) {
    const { socket } = useSocket();

    // Memoize the handler to prevent recreation on every render
    // This prevents the effect from re-running unnecessarily
    const memoizedHandler = useCallback(handler, [handler]);

    useEffect(() => {
        if (!socket) return;

        socket.on(eventName, memoizedHandler);

        return () => {
            socket.off(eventName, memoizedHandler);
        };
    }, [socket, eventName, memoizedHandler]);
}
