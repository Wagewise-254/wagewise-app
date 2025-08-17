// types/employee.ts
export interface EmployeeWithHelb {
  id: string;
  first_name: string;
  last_name: string;
  // flattened HELB fields
  helb_account_number?: string;
  initial_balance?: number;
  monthly_deduction?: number;
  status?: "Active" | "Inactive";
}
