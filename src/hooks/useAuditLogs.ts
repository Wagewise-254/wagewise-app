import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  action: string;
  performed_by: string | null;
  created_at: string;
  performer?: {
    full_name: string;
    email: string;
  };
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useAuditLogs = (companyId: string) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    action: 'ALL',
    search: ''
  });

  const session = useAuthStore.getState().session;
  const token = session?.access_token;

  const fetchLogs = useCallback(async (page = 1) => {
    if (!companyId || !token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.action && filters.action !== 'ALL' && { action: filters.action }),
        ...(filters.search && { search: filters.search })
      });

      const { data } = await axios.get<AuditLogsResponse>(
        `${API_BASE_URL}/company/${companyId}/audit-logs?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [companyId, token, filters, pagination.limit]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return {
    logs,
    loading,
    pagination,
    filters,
    setFilters,
    fetchLogs,
    refetch: () => fetchLogs(pagination.page)
  };
};