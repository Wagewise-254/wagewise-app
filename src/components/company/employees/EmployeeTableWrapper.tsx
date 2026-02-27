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
}

export default function EmployeeTableWrapper({ 
  statusFilter, 
  excludeStatus = false,
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

      // Filter employees based on status
      let filteredData = data;
      
      if (statusFilter) {
        const statuses = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        
        filteredData = data.filter((emp: Employee) => {
          const empStatus = emp.employee_status;
          
          if (excludeStatus) {
            // Exclude employees with these statuses
            return !statuses.includes(empStatus);
          } else {
            // Include employees with these statuses
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Showing {employees.length} employee{employees.length !== 1 ? 's' : ''}
        </p>
      </div>

      <EmployeesTable 
        data={employees} 
        loading={loading} 
        error={error} 
        onDeleteSuccess={fetchEmployees}
        showActions={true}
      />
    </div>
  );
}