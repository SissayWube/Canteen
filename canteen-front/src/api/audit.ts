import api from './api';

export interface AuditLog {
    _id: string;
    action: string;
    subModel?: string;
    subId?: string;
    performedBy: string;
    performedByUsername: string;
    details: any;
    ipAddress?: string;
    timestamp: string;
}

export interface AuditLogResponse {
    logs: AuditLog[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export const auditApi = {
    getAll: async (page = 1, limit = 50, action?: string) => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (action) params.append('action', action);

        const response = await api.get<AuditLogResponse>(`/audit?${params.toString()}`);
        return response.data;
    },
};
