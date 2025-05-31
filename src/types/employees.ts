// src/types/employees.ts

import { z } from "zod";
import { addEmployeeSchema } from "@/schemas/addEmployeeSchema";

export type AddEmployeeFormData = z.infer<typeof addEmployeeSchema>;

// Step 1: Personal Info
export const personalInfoFields = [
  "first_name",
  "last_name",
  "other_names",
  "email",
  "phone",
  "id_type",
  "id_number",
  "kra_pin",
  "shif_number",
  "nssf_number",
  "date_of_birth",
  "gender",
  "marital_status",
  "citizenship",
  "has_disability"
];

// Step 2: Employment Details
export const employmentDetailsFields = [
  "employee_number",
  "date_joined",
  "job_title",
  "department",
  "job_type",
  "employee_status",
  "employee_status_effective_date",
  "end_of_probation_date",
  "contract_start_date",
  "contract_end_date",
  "termination_date",
  "termination_reason"
];

// Step 3: Payment & Tax
export const paymentAndTaxFields = [
  "basic_salary",
  "salary_effective_date",
  "payment_method",
  "bank_name",
  "bank_branch",
  "bank_code",
  "bank_account_number",
  "mpesa_phone_number",
  "is_helb_paying",
  "helb_account_number",
  "helb_monthly_deduction_amount",
  "paye_tax_exemption",
  "disability_tax_exemption",
  "paye_exemption_certificate_number",
  "disability_exemption_certificate_number",
  "owner_occupied_interest_amount",
  "pension_fund_contribution_amount",
  "fbt_loan_type",
  "fbt_loan_principal_amount",
  "fbt_loan_interest_rate_charged",
  "fbt_loan_start_date",
  "fbt_loan_is_active",
  "allowances_json",
  "non_cash_benefits_json",
  "other_deductions_json"
];

// Step 4: Address, Next of Kin & Extras
export const addressAndNextOfKinFields = [
  "physical_address",
  "postal_address",
  "county",
  "postal_code",
  "next_of_kin_name",
  "next_of_kin_relationship",
  "next_of_kin_phone"
];
