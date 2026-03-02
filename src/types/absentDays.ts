export type AbsentDays = {
  id: string;
  employee_id: string;
  company_id: string;
  month: number;
  year: number;
  absent_days: number;
  total_deduction_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
};