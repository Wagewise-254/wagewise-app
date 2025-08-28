// src/pages/company/hr/EmployeesPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useHrStore } from "@/stores/hrStore";
import AddEmployeeDialog from "@/components/company/hr/employee/AddEmployeeDialog";
import EmployeesTable from "@/components/company/hr/employee/EmployeesTable";
import ImportEmployeeDialog from "./ImportEmployeeDialog";
import { CloudUpload } from "lucide-react";

// ✅ ShadCN Card components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EmployeeSection = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { fetchEmployees } = useHrStore();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchEmployees(companyId);
    }
  }, [companyId, fetchEmployees]);

  return (
    <div className="container mx-auto p-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Employees</CardTitle>
            <CardDescription>
              View and manage your company’s employees.
            </CardDescription>
          </div>
          <div className="flex space-x-2">
             <Button variant="outline" className="cursor-pointer" onClick={() => setIsImportDialogOpen(true)}>
                 <CloudUpload className="mr-2 h-4 w-4" /> Import Employees
            </Button>
            <AddEmployeeDialog />
          </div>
        </CardHeader>

        <CardContent>
          <EmployeesTable />
        </CardContent>
      </Card>
      <ImportEmployeeDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
      />
    </div>
  );
};

export default EmployeeSection;
