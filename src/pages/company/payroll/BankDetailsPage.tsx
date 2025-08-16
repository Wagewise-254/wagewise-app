import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { DataTable, Employee } from "@/components/company/payroll/DataTable";
import EditBankDialog, { Bank } from "./EditBankDialog";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

// ✅ Import shadcn Card
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const BankDetailsPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;
    
    setLoading(true);
    setError(null);

    try {
      const [employeesResponse, banksResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/company/${companyId}/employees`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${API_BASE_URL}/company/banks`),
      ]);

      if (!employeesResponse.ok) throw new Error("Failed to fetch employees.");
      if (!banksResponse.ok) throw new Error("Failed to fetch bank list.");

      const employeesData = await employeesResponse.json();
      const banksData = await banksResponse.json();

      setEmployees(employeesData);
      setBanks(banksData);

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
          <CardTitle className="text-2xl font-bold">Employee Payment Details</CardTitle>
          <CardDescription>
            View and manage how your employees get paid.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable data={employees} onEdit={handleEdit} />
        </CardContent>
      </Card> 

      <EditBankDialog
        employee={selectedEmployee}
        companyId={companyId!}
        banks={banks}
        onClose={handleCloseDialog}
        onUpdated={handleUpdateSuccess}
      />
    </div>
  );
};

export default BankDetailsPage;
