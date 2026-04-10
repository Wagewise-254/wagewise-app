// pages/company/employees/TerminatedEmployees.tsx
import EmployeeTableWrapper from "@/components/company/employees/EmployeeTableWrapper";

export default function TerminatedEmployees() {
  return (
    <div className="h-full">
      <EmployeeTableWrapper 
        statusFilter="TERMINATED"
        hideActions={true}
      />
    </div>
  );
}