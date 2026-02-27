// pages/company/audit/AuditLogs.tsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import AuditLogsTable from "@/components/company/audit/AuditLogsTable";
import { useAuditLogs } from "@/hooks/useAuditLogs";
//import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogs() {
  const { companyId } = useParams<{ companyId: string }>();
  const {
    logs,
    summary,
    loading,
    pagination,
    filters,
    setFilters,
    fetchLogs,
    fetchEntityTypes,
    refetch
  } = useAuditLogs(companyId!);

  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  useEffect(() => {
    const loadEntityTypes = async () => {
      const types = await fetchEntityTypes();
      setEntityTypes(types);
    };
    loadEntityTypes();
  }, [fetchEntityTypes]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    fetchLogs(1);
  };

  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">
          Company Audit Logs
        </h2>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Logs (30 days)</p>
              <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
            </CardContent>
          </Card>
          {Object.entries(summary.byAction).map(([action, count]) => (
            <Card key={action}>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">{action}</p>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Audit Logs Table */}
      <AuditLogsTable
        logs={logs}
        loading={loading}
        pagination={pagination}
        filters={filters}
        entityTypes={entityTypes}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onRefresh={refetch}
      />
    </div>
  );
}