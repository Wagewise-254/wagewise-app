// src/pages/company/hr/EmployeesPage.tsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useHrStore } from "@/stores/hrStore";
import AddEmployeeDialog from "@/components/company/hr/AddEmployeeDialog";
import EmployeesTable from "@/components/company/hr/EmployeesTable";

// ✅ ShadCN Card components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const EmployeesPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { fetchEmployees } = useHrStore();

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
          <AddEmployeeDialog />
        </CardHeader>

        <CardContent>
          <EmployeesTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeesPage;
