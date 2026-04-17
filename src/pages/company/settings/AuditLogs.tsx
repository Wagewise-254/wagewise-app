import { useParams } from "react-router-dom";
import AuditLogsTable from "@/components/company/audit/AuditLogsTable";
import { useAuditLogs } from "@/hooks/useAuditLogs";

export default function AuditLogs() {
  const { companyId } = useParams<{ companyId: string }>();
  const {
    logs,
    loading,
    pagination,
    filters,
    setFilters,
    fetchLogs,
    refetch
  } = useAuditLogs(companyId!);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    fetchLogs(1);
  };

  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <AuditLogsTable
        logs={logs}
        loading={loading}
        pagination={pagination}
        filters={filters}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onRefresh={refetch}
      />
    </div>
  );
}