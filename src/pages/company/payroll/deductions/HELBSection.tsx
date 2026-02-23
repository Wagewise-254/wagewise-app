import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import AddHelbDialog from "@/components/payroll/helb/AddHelbDialog";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, Plus } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import HelbDataTable from "@/components/payroll/helb/HelbTable";
import EditHelbDialog from "@/components/payroll/helb/EditHelbDialog";
import DeleteHelbDialog from "@/components/payroll/helb/DeleteHelbDialog";

export type EmployeeWithHelb = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  departments: { name: string } | null;
  job_titles: { title: string } | null;
  helb_accounts?: {
    id: string;
    helb_account_number: string;
    monthly_deduction: number;
    start_date: string;
    initial_balance: number;
    current_balance: number;
    status: string;
  };
};

export default function HELBSection() {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();

  const [employees, setEmployees] = useState<EmployeeWithHelb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithHelb | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/helb`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch HELB records.");

      const data = await response.json();
      setEmployees(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdated = () => {
    setIsAddDialogOpen(false);
    fetchData();
  };

  const handleEdit = (employee: EmployeeWithHelb) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (employee: EmployeeWithHelb) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    handleCloseEditDialog();
    handleUpdated();
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  const stats = {
    total: employees.length,
    active: employees.filter(emp => emp.helb_accounts?.status === "ACTIVE").length,
    withHelb: employees.filter(emp => emp.helb_accounts).length,
    withoutHelb: employees.filter(emp => !emp.helb_accounts).length,
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#7F5EFD] mb-4" />
        <p className="text-slate-500">Loading HELB records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-sm border border-red-200">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-none rounded-sm border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Employees</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none rounded-sm border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">With HELB</p>
            <p className="text-2xl font-bold text-green-600">{stats.withHelb}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none rounded-sm border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Active Deductions</p>
            <p className="text-2xl font-bold text-[#7F5EFD]">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none rounded-sm border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Without HELB</p>
            <p className="text-2xl font-bold text-slate-400">{stats.withoutHelb}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none rounded-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              HELB Deductions
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 mt-1">
              View and manage Higher Education Loans Board (HELB) records for your employees.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#7F5EFD] hover:bg-[#6a4acb] text-white rounded-sm shadow-none cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add HELB Record
          </Button>
        </CardHeader>
        <CardContent>
          <HelbDataTable
            data={employees}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <AddHelbDialog
        companyId={companyId!}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onUpdated={handleUpdated}
      />

      {isEditDialogOpen && selectedEmployee && (
        <EditHelbDialog
          employee={selectedEmployee}
          companyId={companyId!}
          onClose={handleCloseEditDialog}
          onUpdated={handleUpdateSuccess}
        />
      )}

      {isDeleteDialogOpen && selectedEmployee && (
        <DeleteHelbDialog
          employee={selectedEmployee}
          companyId={companyId!}
          onClose={handleCloseDeleteDialog}
          onDeleted={handleUpdateSuccess}
        />
      )}
    </div>
  );
}