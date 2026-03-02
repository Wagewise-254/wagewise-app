// src/types/deduction.ts (create this file)

export type AssignedDeduction = {
  id: string;
  deduction_type_id: string;
  company_id: string;
  employee_id: string | null;
  department_id: string | null;
  sub_department_id: string | null;
  job_title_id: string | null;
  value: number;
  calculation_type: "FIXED" | "PERCENTAGE";
  is_recurring: boolean;
  start_month: string; // Changed from start_date
  start_year: number;  // New field
  number_of_months: number | null;
  end_month: string | null; // Changed from end_date
  end_year: number | null;  // New field
  created_at: string;
  applies_to: "INDIVIDUAL" | "COMPANY" | "DEPARTMENT" | "SUB_DEPARTMENT" | "JOB_TITLE";
  metadata: Record<string, unknown>;
  deduction_types: {
    name: string;
    code: string;
    is_pre_tax: boolean;
  };
  employees?: {
    first_name: string;
    middle_name: string;
    last_name: string;
    employee_number: string;
  };
  departments?: {
    name: string;
  };
  sub_departments?: {
    name: string;
  };
  job_titles?: {
    title: string;
  };
};

// Helper function to get formatted end date
export const getFormattedEndDate = (deduction: AssignedDeduction): string => {
  if (deduction.is_recurring && !deduction.end_month) {
    return "Ongoing";
  }
  if (deduction.end_month && deduction.end_year) {
    return `${deduction.end_month} ${deduction.end_year}`;
  }
  return "Ongoing";
};

// Helper function to get formatted start date
export const getFormattedStartDate = (deduction: AssignedDeduction): string => {
  return `${deduction.start_month} ${deduction.start_year}`;
};

// Month names constant
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper to calculate end month/year from start and duration
// Helper to calculate end month/year from start and duration
export const calculateEndPeriod = (
  startMonth: string,
  startYear: number,
  numberOfMonths: number
): { endMonth: string; endYear: number } => {
  const startMonthIndex = MONTHS.indexOf(startMonth);
  // For 1 month, end should be same as start
  // For 2+ months, calculate properly
  const totalMonths = startMonthIndex + (numberOfMonths - 1); // Subtract 1 to make it inclusive
  
  const endYear = startYear + Math.floor(totalMonths / 12);
  const endMonthIndex = totalMonths % 12;
  const endMonth = MONTHS[endMonthIndex];
  
  return { endMonth, endYear };
};