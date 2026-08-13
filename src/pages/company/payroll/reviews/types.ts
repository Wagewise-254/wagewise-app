export interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
  status: string;
  total_gross_pay: number;
  total_net_pay: number;
  total_statutory_deductions: number;
  total_employees: number;
  employee_count: number;
  eligible_count: number;
  ineligible_count: number;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
}

export interface PayrollDetail {
  id: string;
  employee_id: string;
  payroll_run_id: string;
  basic_salary: number;
  gross_pay: number;
  net_pay: number;
  paye_tax: number;
  nssf_deduction: number;
  shif_deduction: number;
  helb_deduction: number;
  housing_levy_deduction: number;
  total_deductions: number;
  total_statutory_deductions: number;
  total_other_deductions: number;
  total_cash_allowances: number;
  total_non_cash_benefits: number;
  total_allowances: number;
  taxable_income: number;
  is_eligible: boolean;
  ineligibility_reason: string | null;
  is_override: boolean;
  override_reason: string | null;
  employee_number: string;
  employee_name: string;
  job_title: string | null;
  department_name: string | null;
  payment_method: string | null;
  bank_name: string | null;
  branch_name: string | null;
  account_name: string | null;
  account_number: string | null;
  mobile_phone: string | null;
  absent_days: number;
  absent_days_deduction: number;
  allowances_details: AllowanceDetail[];
  deductions_details: DeductionDetail[];
  payslip_generated_at: string | null;
  payslip_sent_at: string | null;
  payslip_sent_method: string | null;
  payslip_viewed_at: string | null;
  payslip_downloaded_at: string | null;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    employee_number: string;
    email: string;
    has_disability: boolean;
    department?: { name: string };
    job_title?: { title: string };
  };
  my_review: {
    id: string  | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewed_at: string | null;
  } | null;
  payroll_reviews?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewed_at: string | null;
    company_reviewer_id: string;
  }[];
}

export interface AllowanceDetail {
  code: string;
  name: string;
  value: number;
  type: 'CASH' | 'NON_CASH';
  is_taxable: boolean;
}

export interface DeductionDetail {
  code: string;
  name: string;
  value: number;
  is_pre_tax: boolean;
}

export interface Reviewer {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_email: string | null;
  reviewer_level: number;
  total_items: number;
  eligible_items: number;
  approved_items: number;
  rejected_items: number;
  pending_items: number;
  completion_percentage: number;
  is_completed: boolean;
}

export interface ReviewStatusResponse {
  payroll: PayrollRun;
  steps: Reviewer[];
  isFullyApproved: boolean;
  summary: {
    totalEmployees: number;
    eligibleEmployees: number;
    totalReviewers: number;
    canApprove: boolean;
  };
}

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UpdateReviewPayload {
  status: ReviewStatus;
}