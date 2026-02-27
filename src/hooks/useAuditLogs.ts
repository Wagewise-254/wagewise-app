// hooks/useAuditLogs.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { AuditLog, AuditLogFilters } from '@/types/audit';

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AuditSummary {
  total: number;
  byAction: Record<string, number>;
  byDay: Record<string, number>;
}

export const useAuditLogs = (companyId: string) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<AuditLogFilters>({
    startDate: '',
    endDate: '',
    action: 'ALL',
    entityType: 'ALL',
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
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.action && filters.action !== 'ALL' && { action: filters.action }),
        ...(filters.entityType && filters.entityType !== 'ALL' && { entityType: filters.entityType }),
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

  const fetchSummary = useCallback(async () => {
    if (!companyId || !token) return;

    try {
      const { data } = await axios.get<AuditSummary>(
        `${API_BASE_URL}/company/${companyId}/audit-logs/summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch audit summary:', error);
    }
  }, [companyId, token]);

  const fetchEntityTypes = useCallback(async () => {
    if (!companyId || !token) return [];

    try {
      const { data } = await axios.get<string[]>(
        `${API_BASE_URL}/company/${companyId}/audit-logs/entity-types`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch entity types:', error);
      return [];
    }
  }, [companyId, token]);

  useEffect(() => {
    fetchLogs(1);
    fetchSummary();
  }, [fetchLogs, fetchSummary]);

  return {
    logs,
    summary,
    loading,
    pagination,
    filters,
    setFilters,
    fetchLogs,
    fetchSummary,
    fetchEntityTypes,
    refetch: () => fetchLogs(pagination.page)
  };
};