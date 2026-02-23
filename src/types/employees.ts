export interface EmployeePaymentDetails {
    id: string;
    employee_id: string;
    payment_method: 'BANK' | 'MOBILE' | 'CASH';
    bank_name: string | null;
    bank_code: string | null;
    branch_name: string | null;
    branch_code: string | null;
    account_number: string | null;
    account_name: string | null;
    mobile_type: string | null;
    phone_number: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface EmployeeContract {
    id: string;
    employee_id: string;
    contract_type: string;
    start_date: string;
    end_date: string | null;
    probation_end_date: string | null;
    contract_status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
    created_at?: string;
}

export interface Employee {
    id: string;
    company_id: string;
    department_id: string | null;
    sub_department_id: string | null;
    job_title_id: string | null;
    reports_to: string | null;
    employee_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    gender: 'Male' | 'Female' | 'Other' | null;
    blood_group: string | null;
    marital_status: string | null;
    hire_date: string;
    job_type: string | null;
    employee_status: string;
    employee_status_effective_date: string;
    id_type: string | null;
    id_number: string | null;
    krapin: string | null;
    shif_number: string | null;
    nssf_number: string | null;
    citizenship: string | null;
    has_disability: boolean;
    salary: number;
    pays_paye: boolean;
    pays_nssf: boolean;
    pays_helb: boolean;
    pays_housing_levy: boolean;
    pays_shif: boolean;
    employee_type?: string | null;
    
    // Relations (Joined from controllers)
    departments: { id: string, name: string } | null;
    sub_departments: { id: string, name: string } | null;
    job_titles: { id: string, title: string } | null;

    // Nested Data from related tables
    employee_payment_details: EmployeePaymentDetails | null;
    employee_contracts: EmployeeContract[];
}

export interface EditDialogProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}