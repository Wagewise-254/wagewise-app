// src/pages/company/payroll/settings/assignDeductions.tsx

import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import DeductionAssignTable, {
  AssignedDeduction,
} from "@/components/company/deductions/DeductionAssignTable";
import AddDeductionDialog, {
  Employee,
  Department,
  SubDepartment,
  JobTitle,
  DeductionType,
} from "@/components/company/deductions/AddDeductionDialog";
import EditDeductionDialog from "@/components/company/deductions/EditDeductionDialog";
import DeleteDeductionDialog from "@/components/company/deductions/DeleteDeductionDialog";
import ImportDeductionDialog from "@/components/company/deductions/ImportDeductionDialog";
import BulkDeleteDeductionDialog from "@/components/company/deductions/BulkDeleteDeductionDialog";

export default function AssignDeductions() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuthStore();

  const [assignedDeductions, setAssignedDeductions] = useState<
    AssignedDeduction[]
  >([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] =
    useState<AssignedDeduction | null>(null);
  const [deductionsToDelete, setDeductionsToDelete] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;

    setLoading(true);
    setError(null);

    try {
      const headers = { Authorization: `Bearer ${session?.access_token}` };

      const [
        deductionsResponse,
        employeesResponse,
        deductionTypesResponse,
        departmentsResponse,
        subDepartmentsResponse,
        jobTitlesResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/company/${companyId}/deductions`, { headers }),
        fetch(`${API_BASE_URL}/company/${companyId}/employees`, { headers }),
        fetch(`${API_BASE_URL}/company/${companyId}/deduction-types`, {
          headers,
        }),
        fetch(`${API_BASE_URL}/company/${companyId}/departments`, { headers }),
        fetch(`${API_BASE_URL}/company/${companyId}/sub-departments`, {
          headers,
        }),
        fetch(`${API_BASE_URL}/company/${companyId}/job-titles`, { headers }),
      ]);

      if (!deductionsResponse.ok) throw new Error("Failed to fetch deductions");
      if (!employeesResponse.ok) throw new Error("Failed to fetch employees");
      if (!deductionTypesResponse.ok)
        throw new Error("Failed to fetch deduction types");
      if (!departmentsResponse.ok)
        throw new Error("Failed to fetch departments");

      const deductionsData = await deductionsResponse.json();
      const employeesData = await employeesResponse.json();
      const deductionTypesData = await deductionTypesResponse.json();
      const departmentsData = await departmentsResponse.json();
      const subDepartmentsData = await subDepartmentsResponse.json();
      const jobTitlesData = await jobTitlesResponse.json();

      setAssignedDeductions(deductionsData);
      setEmployees(employeesData);
      setDeductionTypes(deductionTypesData);
      setDepartments(departmentsData);
      setSubDepartments(subDepartmentsData);
      setJobTitles(jobTitlesData);
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

  const handleBulkDeleteClick = (deductionIds: string[]) => {
    setDeductionsToDelete(deductionIds);
    setIsBulkDeleteDialogOpen(true);
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

  const handleImportSuccess = () => {
    setIsImportDialogOpen(false);
    fetchData();
  };

  return (
    <div className="p-2 space-y-4">
      <Card className="rounded-sm border border-slate-200 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col">
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/company/${companyId}/payroll/deductions/overview`,
                      )
                    }
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back to Deductions Settings</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Assigned Deductions
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  View and manage deductions assigned to employees, departments,
                  or job titles.
                </CardDescription>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2 cursor-pointer rounded-sm shadow-none border border-slate-300"
            >
              <FileUp className="h-4 w-4" /> Bulk Import
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-[#1F3A8A] cursor-pointer rounded-sm shadow-none text-white hover:bg-[#6a4ad3]"
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
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : (
            <DeductionAssignTable
              data={assignedDeductions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDeleteClick={handleBulkDeleteClick}
            />
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
          subDepartments={subDepartments}
          jobTitles={jobTitles}
        />
      )}

      {isEditDialogOpen && selectedDeduction && (
        <EditDeductionDialog
          deduction={selectedDeduction}
          companyId={companyId!}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onUpdated={handleUpdateSuccess}
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

      {isBulkDeleteDialogOpen && deductionsToDelete.length > 0 && (
        <BulkDeleteDeductionDialog
          companyId={companyId!}
          deductionIds={deductionsToDelete}
          isOpen={isBulkDeleteDialogOpen}
          onClose={() => {
            setIsBulkDeleteDialogOpen(false);
            setDeductionsToDelete([]);
          }}
          onDeleted={handleUpdateSuccess}
        />
      )}

      {isImportDialogOpen && (
        <ImportDeductionDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onUpdated={handleImportSuccess}
        />
      )}
    </div>
  );
}
