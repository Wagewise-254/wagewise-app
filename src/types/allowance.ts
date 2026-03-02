// src/types/allowance.ts (create this file)

export type HousingMetadata = {
  type: "ordinary" | "farm" | "service_director";
  is_employer_owned?: boolean;
  rent_paid_to_employer?: number;
};

export type CarMetadata = {
  engine_cc: number;
};

export type MealMetadata = Record<string, never>;

export type Allowance = {
  id: string;
  allowance_type_id: string;
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
  applies_to:
    | "INDIVIDUAL"
    | "COMPANY"
    | "DEPARTMENT"
    | "SUB_DEPARTMENT"
    | "JOB_TITLE";
  metadata:
    | HousingMetadata
    | CarMetadata
    | MealMetadata
    | Record<string, never>;
  allowance_types: {
    name: string;
    code: string;
    is_cash: boolean;
    is_taxable: boolean;
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
export const getFormattedEndDate = (allowance: Allowance): string => {
  if (allowance.is_recurring && !allowance.end_month) {
    return "Ongoing";
  }
  if (allowance.end_month && allowance.end_year) {
    return `${allowance.end_month} ${allowance.end_year}`;
  }
  return "Ongoing";
};

// Helper function to get formatted start date
export const getFormattedStartDate = (allowance: Allowance): string => {
  return `${allowance.start_month} ${allowance.start_year}`;
};

// Month names constant
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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