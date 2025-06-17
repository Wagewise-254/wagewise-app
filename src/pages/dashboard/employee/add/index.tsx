import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import * as z from 'zod';

import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

import PersonalDetailsStep, { StepFormRef as PersonalStepRef } from './PersonalDetailsStep';
import ContactKinStep, { StepFormRef as ContactStepRef } from './ContactKinStep';
import JobDetailsStep, { StepFormRef as JobStepRef } from './JobDetailsStep';
import CompensationStep, { StepFormRef as CompStepRef } from './CompensationStep';

const STEPS = [
  { number: 1, title: 'Personal', component: PersonalDetailsStep },
  { number: 2, title: 'Contact & Kin', component: ContactKinStep },
  { number: 3, title: 'Employment', component: JobDetailsStep },
  { number: 4, title: 'Compensation', component: CompensationStep },
];

type EmployeeFormData = {
  // Personal
  employee_number: string;
  first_name: string;
  last_name: string;
  other_names: string;
  date_of_birth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  marital_status?: string;
  citizenship: string;
  id_type?: 'National ID' | 'Passport';
  id_number: string;
  has_disability: boolean;
  disability_exemption_certificate_number: string;
  // Contact & Kin
  email: string;
  phone: string;
  physical_address: string;
  postal_address: string;
  county: string;
  postal_code: string;
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_phone: string;
  // Employment
  job_title: string;
  department: string;
  date_joined?: Date;
  job_type?: 'Permanent' | 'Contract' | 'Part-time' | 'Internship' | 'Casual';
  employee_status?: 'Active' | 'On Leave' | 'Terminated' | 'Probation' | 'Confirmed';
  employee_status_effective_date?: Date;
  end_of_probation_date?: Date;
  contract_start_date?: Date;
  contract_end_date?: Date;
  termination_date?: Date;
  termination_reason: string;
  // Compensation
  basic_salary: number;
  payment_method?: 'Bank Transfer' | 'Cash' | 'Cheque' | 'M-Pesa';
  bank_name: string;
  bank_branch: string;
  bank_account_number: string;
  mpesa_phone_number: string;
  kra_pin: string;
  nssf_number: string;
  shif_number: string;
  paye_tax_exemption: boolean;
  paye_exemption_certificate_number: string;
  is_helb_paying: boolean;
  helb_account_number: string;
  helb_monthly_deduction_amount: number;
  allowances_json: { type: string; value: number }[];
  non_cash_benefits_json: { type: string; value: number }[];
  other_deductions_json: { type: string; value: number }[];
};

const initialFormData: EmployeeFormData = {
  // Personal
  employee_number: '', first_name: '', last_name: '', other_names: '',
  date_of_birth: undefined, gender: undefined, marital_status: undefined,
  citizenship: 'Kenyan', id_type: undefined, id_number: '',
  has_disability: false, disability_exemption_certificate_number: '',
  // Contact & Kin
  email: '', phone: '', physical_address: '', postal_address: '', county: '', postal_code: '',
  next_of_kin_name: '', next_of_kin_relationship: '', next_of_kin_phone: '',
  // Employment
  job_title: '', department: '', date_joined: undefined, job_type: undefined,
  employee_status: undefined, employee_status_effective_date: undefined,
  end_of_probation_date: undefined, contract_start_date: undefined,
  contract_end_date: undefined, termination_date: undefined, termination_reason: '',
  // Compensation
  basic_salary: 0, payment_method: undefined, bank_name: '', bank_branch: '',
  bank_account_number: '', mpesa_phone_number: '', kra_pin: '', nssf_number: '', shif_number: '',
  paye_tax_exemption: false, paye_exemption_certificate_number: '',
  is_helb_paying: false, helb_account_number: '', helb_monthly_deduction_amount: 0,
  allowances_json: [], non_cash_benefits_json: [], other_deductions_json: [],
};

const finalFormSchema = z.object({
    employee_number: z.string().min(1, 'Employee number is required.'),
    first_name: z.string().min(2, 'First name is required.'),
    last_name: z.string().min(2, 'Last name is required.'),
    date_of_birth: z.date({ required_error: 'Date of birth is required.' }),
    gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required.' }),
    id_type: z.enum(['National ID', 'Passport'], { required_error: 'ID type is required.' }),
    id_number: z.string().min(5, 'ID number is required.'),
    phone: z.string().min(10, 'Phone number is required.'),
    date_joined: z.date({ required_error: 'Date joined is required.' }),
    job_type: z.enum(['Permanent', 'Contract', 'Part-time', 'Internship', 'Casual'], { required_error: 'Job type is required.' }),
    employee_status: z.enum(['Active', 'On Leave', 'Terminated', 'Probation', 'Confirmed'], { required_error: 'Employee status is required.' }),
    basic_salary: z.coerce.number().min(1, 'Basic salary must be greater than 0.'),
    payment_method: z.enum(['Bank Transfer', 'Cash', 'Cheque', 'M-Pesa'], { required_error: 'Payment method is required.' }),
    kra_pin: z.string().regex(/^[A-Z][0-9]{9}[A-Z]$/, 'Invalid KRA PIN format'),
}).catchall(z.any());

type StepRef = PersonalStepRef | ContactStepRef | JobStepRef | CompStepRef;

const AddEmployeePage = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const stepFormRef = useRef<StepRef>(null);

  const handleNext = async () => {
    if (!stepFormRef.current) return;
    const isValid = await stepFormRef.current.trigger();
    if (isValid) {
      const stepData = stepFormRef.current.getValues();
    setFormData((prev: EmployeeFormData) => ({ ...prev, ...stepData as Partial<EmployeeFormData> }));
      setCurrentStep((prev) => prev + 1);
    } else {
      toast.error('Please fix the errors before proceeding.');
    }
  };

  const handleBack = () => {
    if (stepFormRef.current) {
      const stepData = stepFormRef.current.getValues();
      setFormData((prev) => ({ ...prev, ...stepData }));
    }
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!stepFormRef.current || !accessToken) return;
    setIsSubmitting(true);
    const isValidOnCurrentStep = await stepFormRef.current.trigger();
    if (!isValidOnCurrentStep) {
        toast.error('Please fix the errors on this step before submitting.');
        setIsSubmitting(false);
        return;
    }
    const finalStepData = stepFormRef.current.getValues();
    const finalData = { ...formData, ...finalStepData };
    const cleanFinalData = {
        ...finalData,
        allowances_json: finalData.allowances_json.filter(item => item.type && item.type.trim() !== ''),
        non_cash_benefits_json: finalData.non_cash_benefits_json.filter(item => item.type && item.type.trim() !== ''),
        other_deductions_json: finalData.other_deductions_json.filter(item => item.type && item.type.trim() !== ''),
    };
    const numericCoercedData = {
        ...cleanFinalData,
        basic_salary: parseFloat(String(cleanFinalData.basic_salary)) || 0,
        helb_monthly_deduction_amount: parseFloat(String(cleanFinalData.helb_monthly_deduction_amount)) || 0,
        allowances_json: cleanFinalData.allowances_json.map(item => ({...item, value: parseFloat(String(item.value)) || 0})),
        non_cash_benefits_json: cleanFinalData.non_cash_benefits_json.map(item => ({...item, value: parseFloat(String(item.value)) || 0})),
        other_deductions_json: cleanFinalData.other_deductions_json.map(item => ({...item, value: parseFloat(String(item.value)) || 0})),
    };
    const finalValidation = finalFormSchema.safeParse(numericCoercedData);
    if (!finalValidation.success) {
        const firstError = finalValidation.error.errors[0];
        toast.error(`Error: ${firstError.path.join('.')} - ${firstError.message}`);
        setIsSubmitting(false);
        return;
    }
    const dataToSend = { ...finalValidation.data };
    Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] instanceof Date) {
            dataToSend[key] = (dataToSend[key] as Date).toISOString().split('T')[0];
        }
    });
    try {
        const response = await axios.post(`${API_BASE_URL}/employees`, dataToSend, { headers: { Authorization: `Bearer ${accessToken}` } });
        toast.success(response.data.message || 'Employee added successfully!');
        navigate('/employee');
    } catch (err) {
        const errorMsg = (axios.isAxiosError(err) && err.response?.data?.error) || 'Failed to add employee.';
        toast.error(errorMsg);
    }
    setIsSubmitting(false);
  };

  const CurrentStepComponent = STEPS[currentStep - 1]?.component;

  return (
    // FIX: Add `overflow-hidden` to the root container
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <SideNav />
      {/* FIX: Add `overflow-y-auto` to the main content area */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" size="sm" onClick={() => navigate('/employee')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Button>
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Add New Employee</CardTitle>
              <div className="flex justify-between items-start w-full max-w-2xl mx-auto mt-6">
                {STEPS.map((step, index) => (
                  <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center text-center w-24">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 ${currentStep >= step.number ? 'bg-[#7F5EFD]' : 'bg-gray-300 dark:bg-gray-600'}`}>{currentStep > step.number ? '✔' : step.number}</div>
                      <p className={`mt-2 text-sm font-medium transition-colors duration-300 ${currentStep >= step.number ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{step.title}</p>
                    </div>
                    {index < STEPS.length - 1 && (<div className={`flex-1 h-1 mt-5 mx-2 transition-colors duration-300 ${currentStep > step.number ? 'bg-[#7F5EFD]' : 'bg-gray-300 dark:bg-gray-600'}`} />)}
                  </React.Fragment>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {/* FIX: Removed the min-h-[500px] to allow natural content flow */}
              <div className="py-6">
                {CurrentStepComponent ? (
                  // @ts-expect-error: Step component refs have different types and are not compatible with React.Ref<unknown>
                  <CurrentStepComponent ref={stepFormRef} defaultValues={formData} />
                ) : null}
              </div>
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isSubmitting}>Back</Button>
                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext} className="bg-[#7F5EFD] hover:bg-[#6a4fdd]">Next</Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-[#7F5EFD] hover:bg-[#6a4fdd]" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AddEmployeePage;
