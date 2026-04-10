// components/company/employees/EmployeeTableWrapper.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import EmployeesTable from "@/components/company/employees/EmployeesTable";
import { Employee } from "@/types/employees";

interface EmployeeTableWrapperProps {
  statusFilter: string | string[];
  excludeStatus?: boolean;
  hideActions?: boolean;
  globalSearchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function EmployeeTableWrapper({ 
  statusFilter, 
  excludeStatus = false,
  hideActions = false,
  globalSearchValue = "",
  onSearchChange,
}: EmployeeTableWrapperProps) {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!companyId || !session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data: Employee[] = await response.json();

      let filteredData = data;
      
      if (statusFilter) {
        const statuses = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        
        filteredData = data.filter((emp: Employee) => {
          const empStatus = emp.employee_status;
          
          if (excludeStatus) {
            return !statuses.includes(empStatus);
          } else {
            return statuses.includes(empStatus);
          }
        });
      }

      setEmployees(filteredData);
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please try again.");
      toast.error("Failed to load employee data.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session, statusFilter, excludeStatus]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div className="h-full flex flex-col">
      {/* Counter - Compact, only show if not hiding actions */}
      {!hideActions && (
        <div className="shrink-0 pb-2">
          <p className="text-xs text-slate-400">
            {employees.length} employee{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Table Container - Takes full height */}
      <div className="flex-1 overflow-hidden">
        <EmployeesTable 
          data={employees} 
          loading={loading} 
          error={error} 
          onDeleteSuccess={fetchEmployees}
          showActions={!hideActions}
          globalSearchValue={globalSearchValue}
          onSearchChange={onSearchChange}
        />
      </div>
    </div>
  );
}