// src/components/company/payroll/deductions/DeductionAssignSection.tsx

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import DeductionAssignTable, { AssignedDeduction } from "./DeductionAssignTable";
import AddDeductionDialog from "./AddDeductionDialog";
import EditDeductionDialog from "./EditDeductionDialog";
import DeleteDeductionDialog from "./DeleteDeductionDialog";
import ImportDeductionDialog from "./ImportDeductionDialog";
import { FileUp } from "lucide-react";

// Define helper types for data fetching
export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
};

export type Department = {
  id: string;
  name: string;
};

export type DeductionType = {
  id: string;
  name: string;
};

export type RawDeduction = {
  id: string;
  deduction_type_id: string;
  employee_id: string | null;
  department_id: string | null;
  value: number;
  calculation_type: "Fixed" | "Percentage";
   is_recurring: boolean;
  start_month: string;
  start_year: number;
  end_month: string | null;
  end_year: number | null;
};



const DeductionAssignSection = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();

  const [assignedDeductions, setAssignedDeductions] = useState<AssignedDeduction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState<AssignedDeduction | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;

    setLoading(true);
    setError(null);
    try {
      const [
        deductionsResponse,
        employeesResponse,
        deductionTypesResponse,
        departmentsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/company/${companyId}/deductions`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
        fetch(`${API_BASE_URL}/company/${companyId}/employees`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
        fetch(`${API_BASE_URL}/company/${companyId}/deduction-types`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
        fetch(`${API_BASE_URL}/company/${companyId}/departments`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
      ]);

      const deductionsData = await deductionsResponse.json();
      const employeesData = await employeesResponse.json();
      const deductionTypesData = await deductionTypesResponse.json();
      const departmentsData = await departmentsResponse.json();

      // Create maps for efficient lookup
      const employeesMap = new Map(employeesData.map((emp: Employee) => [emp.id, emp]));
      const deductionTypesMap = new Map(deductionTypesData.map((type: DeductionType) => [type.id, type]));
      const departmentsMap = new Map(departmentsData.map((dept: Department) => [dept.id, dept]));

      // Enrich deductions data with nested objects
      const enrichedDeductions = deductionsData.map((deduction: RawDeduction) => ({
        ...deduction,
        deduction_type: deductionTypesMap.get(deduction.deduction_type_id),
        employee: deduction.employee_id ? employeesMap.get(deduction.employee_id) : null,
        department: deduction.department_id ? departmentsMap.get(deduction.department_id) : null,
      }));

      setAssignedDeductions(enrichedDeductions);
      setEmployees(employeesData);
      setDeductionTypes(deductionTypesData);
      setDepartments(departmentsData);

    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please try again.");
      toast.error("Failed to load deduction data.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSuccess = () => {
    fetchData();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (deduction: AssignedDeduction) => {
    setSelectedDeduction(deduction);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (deduction: AssignedDeduction) => {
    setSelectedDeduction(deduction);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedDeduction(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedDeduction(null);
  };

  const handleUpdateSuccess = () => {
    fetchData();
    handleCloseEditDialog();
    handleCloseDeleteDialog();
  };

  // Add an import success handler
  const handleImportSuccess = () => {
      setIsImportDialogOpen(false);
      fetchData();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col">
            <CardTitle className="text-2xl font-bold">Assigned Deductions</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              View and manage deductions assigned to employees or departments.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportDialogOpen(true)} // <-- Add this button handler
                className="flex items-center gap-2"
            >
                <FileUp className="h-4 w-4" /> Bulk Import
            </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]"
          >
            Assign Deduction
          </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              {error}
            </div>
          ) : (
            <DeductionAssignTable data={assignedDeductions} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {isAddDialogOpen && (
        <AddDeductionDialog
          companyId={companyId!}
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onUpdated={handleAddSuccess}
          employees={employees}
          deductionTypes={deductionTypes}
          departments={departments}
        />
      )}

      {isEditDialogOpen && selectedDeduction && (
        <EditDeductionDialog
          deduction={selectedDeduction}
          companyId={companyId!}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onUpdated={handleUpdateSuccess}
          employees={employees}
          deductionTypes={deductionTypes}
          departments={departments}
        />
      )}

      {isDeleteDialogOpen && selectedDeduction && (
        <DeleteDeductionDialog
          deduction={selectedDeduction}
          companyId={companyId!}
          isOpen={isDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onDeleted={handleUpdateSuccess}
        />
      )}
      {/* New Bulk Import Dialog */}
      {isImportDialogOpen && (
        <ImportDeductionDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            onUpdated={handleImportSuccess}
        />
      )}
    </>
  );
};

export default DeductionAssignSection;