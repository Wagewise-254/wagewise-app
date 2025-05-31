// src/schemas/addEmployeeSchema.ts

import * as z from "zod";

export const addEmployeeSchema = z.object({
  employee_number: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  other_names: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1),
  id_type: z.string().min(1),
  id_number: z.string().min(1),
  kra_pin: z.string().min(1),
  shif_number: z.string().optional(),
  nssf_number: z.string().optional(),
  date_of_birth: z.coerce.date(),
  gender: z.string().min(1),
  marital_status: z.string().optional(),
  citizenship: z.string().optional(),
  has_disability: z.boolean().optional(),

  date_joined: z.coerce.date(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  job_type: z.string().min(1),
  employee_status: z.string().min(1),
  employee_status_effective_date: z.coerce.date().optional(),
  end_of_probation_date: z.coerce.date().optional(),
  contract_start_date: z.coerce.date().optional(),
  contract_end_date: z.coerce.date().optional(),
  termination_date: z.coerce.date().optional(),
  termination_reason: z.string().optional(),
  basic_salary: z.coerce.number().nonnegative(),
  salary_effective_date: z.coerce.date().optional(),

  payment_method: z.string().min(1),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  bank_code: z.string().optional(),
  bank_account_number: z.string().optional(),
  mpesa_phone_number: z.string().optional(),

  is_helb_paying: z.boolean().optional(),
  helb_account_number: z.string().optional(),
  helb_monthly_deduction_amount: z.coerce.number().optional(),

  paye_tax_exemption: z.boolean().optional(),
  paye_exemption_certificate_number: z.string().optional(),
  disability_tax_exemption: z.boolean().optional(),
  disability_exemption_certificate_number: z.string().optional(),

  physical_address: z.string().optional(),
  postal_address: z.string().optional(),
  county: z.string().optional(),
  postal_code: z.string().optional(),

  next_of_kin_name: z.string().optional(),
  next_of_kin_relationship: z.string().optional(),
  next_of_kin_phone: z.string().optional(),

  allowances_json: z.any().optional(),
  non_cash_benefits_json: z.any().optional(),
  other_deductions_json: z.any().optional(),

  owner_occupied_interest_amount: z.coerce.number().optional(),
  pension_fund_contribution_amount: z.coerce.number().optional(),

  fbt_loan_type: z.string().optional(),
  fbt_loan_principal_amount: z.coerce.number().optional(),
  fbt_loan_interest_rate_charged: z.coerce.number().optional(),
  fbt_loan_start_date: z.coerce.date().optional(),
  fbt_loan_is_active: z.boolean().optional(),

  logo: z.string().optional()
});
