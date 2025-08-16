import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useHrStore } from "@/stores/hrStore";
import AddDepartmentDialog from "@/components/company/hr/AddDepartmentDialog";
import DepartmentsTable from "@/components/company/hr/DepartmentsTable";

// ✅ Import ShadCN Card components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const DepartmentsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { fetchDepartments } = useHrStore();

  useEffect(() => {
    if (companyId) {
      fetchDepartments(companyId);
    }
  }, [companyId, fetchDepartments]);

  return (
    <div className="container mx-auto p-6">
      {/* ✅ Card wrapper */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Departments</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Manage and organize company departments.
            </CardDescription>
          </div>
          <AddDepartmentDialog />
        </CardHeader>

        <CardContent>
          <DepartmentsTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentsPage;
