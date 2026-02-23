import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EmployeesTable from "@/components/company/employees/EmployeesTable";
import ImportEmployeeDialog from "@/components/company/employees/ImportEmployeeDialog";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Employee } from "@/types/employees";
import { Plus, CloudUpload, ArrowLeft } from "lucide-react";

export default function EmployeeSection() {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const navigate = useNavigate();

  const fetchEmployees = useCallback(async () => {
    if (!companyId || !session) return;

    setLoading(true);
    setError(null);

    try {
      const employeesResponse = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );

      const employeesData = await employeesResponse.json();

      /*// Create maps for efficient lookup
      const employeesMap = new Map(
        employeesData.map((emp: Employee) => [emp.id, emp])
      );*/
      setEmployees(employeesData);
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please try again.");
      toast.error("Failed to load deduction data.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDeleteSuccess = () => {
    fetchEmployees(); // Re-fetch employees
  };

  return (
    <div className="min-h-full flex flex-col">
      <Card className="flex flex-col flex-1 shadow-none rounded-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <header className="space-y-1">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => navigate(`/company/${companyId}/modules`)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back</p>
                </TooltipContent>
              </Tooltip>
              <CardTitle className="text-2xl font-bold">Employees</CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-400 pl-11">
              Manage employee records, status, and lifecycle.
            </CardDescription>
          </header>

          <div className="flex space-x-2 ">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="cursor-pointer shadow-none"
            >
              <CloudUpload className="mr-2 h-4 w-4" /> Import Employees
            </Button>
            <Button
              onClick={() =>
                navigate(`/company/${companyId}/employees/add-employee`)
              }
              className="bg-[#1F3A8A] hover:bg-[#6a4ad3] cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          <EmployeesTable data={employees} loading={loading} error={error} onDeleteSuccess={handleDeleteSuccess}  />
        </CardContent>
        <ImportEmployeeDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          fetchEmployees={fetchEmployees}
          
        />
      </Card>
    </div>
  );
}
