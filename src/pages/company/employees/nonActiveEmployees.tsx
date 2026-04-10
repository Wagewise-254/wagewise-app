// pages/company/employees/nonActiveEmployees.tsx
import EmployeeTableWrapper from "@/components/company/employees/EmployeeTableWrapper";
import { EmployeeStatus } from "@/types/employees";

const NON_ACTIVE_STATUSES: EmployeeStatus[] = ["ON LEAVE", "SUSPENDED"];

export default function NonActiveEmployees() {
  return (
    <div className="h-full">
      <EmployeeTableWrapper 
        statusFilter={NON_ACTIVE_STATUSES}
        hideActions={true}
      />
    </div>
  );
}