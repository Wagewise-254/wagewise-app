// pages/company/employees/TerminatedEmployees.tsx
import { Card, CardContent } from "@/components/ui/card";
import EmployeeTableWrapper from "@/components/company/employees/EmployeeTableWrapper";

export default function TerminatedEmployees() {
  return (
    <Card className="shadow-none rounded-none border-none">
      <CardContent className="pt-6">
        <EmployeeTableWrapper 
          statusFilter="TERMINATED"
        />
      </CardContent>
    </Card>
  );
}