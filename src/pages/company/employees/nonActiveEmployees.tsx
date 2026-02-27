// pages/company/employees/nonActiveEmployees.tsx
import { Card, CardContent } from "@/components/ui/card";
import EmployeeTableWrapper from "@/components/company/employees/EmployeeTableWrapper";
import { EmployeeStatus } from "@/types/employees";

const NON_ACTIVE_STATUSES: EmployeeStatus[] = ["ON LEAVE", "SUSPENDED"];

export default function NonActiveEmployees() {
  return (
    <Card className="shadow-none rounded-none border-none">
      <CardContent className="pt-6">
        <EmployeeTableWrapper 
          statusFilter={NON_ACTIVE_STATUSES}
        />
      </CardContent>
    </Card>
  );
}