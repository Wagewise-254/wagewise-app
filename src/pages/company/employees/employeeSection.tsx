// pages/company/employees/employeeSection.tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CloudUpload } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import ImportEmployeeDialog from "@/components/company/employees/ImportEmployeeDialog";
import EmployeeTableWrapper from "@/components/company/employees/EmployeeTableWrapper";

export default function EmployeeSection() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  return (
    <div className="min-h-full flex flex-col">
      <Card className="flex flex-col flex-1 shadow-none rounded-none border-none">
        <CardHeader className="flex items-end">
          <div className="flex space-x-2">
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
          <EmployeeTableWrapper 
            statusFilter="ACTIVE"
          />
        </CardContent>

        <ImportEmployeeDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          fetchEmployees={() => {}}
        />
      </Card>
    </div>
  );
}