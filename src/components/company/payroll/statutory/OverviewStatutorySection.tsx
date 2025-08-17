// src/components/company/payroll/statutory/StatutoryPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { StatutoryTable } from "@/components/company/payroll/statutory/StatutoryTable";
import EditStatutoryDialog from "./EditStatutoryDialog";
import { API_BASE_URL } from "@/config"; // Updated import
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Employee } from "@/types/statutory"; 

const OverviewStatutorySection = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/statutories`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch statutory data.");

      const employeesData = await response.json();
      setEmployees(employeesData);

    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (employee: Employee) => setSelectedEmployee(employee);
  const handleCloseDialog = () => setSelectedEmployee(null);
  const handleUpdateSuccess = () => {
    handleCloseDialog();
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Employee Statutory Deductions</CardTitle>
          <CardDescription>
            View and manage statutory deduction statuses for your employees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatutoryTable data={employees} onEdit={handleEdit} />
        </CardContent>
      </Card> 

      <EditStatutoryDialog
        employee={selectedEmployee}
        companyId={companyId!}
        onClose={handleCloseDialog}
        onUpdated={handleUpdateSuccess}
      />
    </div>
  );
};

export default OverviewStatutorySection;