import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';

import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';
import { Employee } from '@/components/dashboard/employee/EmployeeTable';

// Import all step components and their ref types
import PersonalDetailsStep, { StepFormRef as PersonalStepRef } from '../add/PersonalDetailsStep';
import ContactKinStep, { StepFormRef as ContactStepRef } from '../add/ContactKinStep';
import JobDetailsStep, { StepFormRef as JobStepRef } from '../add/JobDetailsStep';
import CompensationStep, { StepFormRef as CompStepRef } from '../add/CompensationStep';

const STEPS = [
  { number: 1, title: 'Personal', component: PersonalDetailsStep },
  { number: 2, title: 'Contact & Kin', component: ContactKinStep },
  { number: 3, title: 'Employment', component: JobDetailsStep },
  { number: 4, title: 'Compensation', component: CompensationStep },
];

// This union type helps TypeScript understand the ref can be one of several types
type StepRef = PersonalStepRef | ContactStepRef | JobStepRef | CompStepRef;

// A specific type for the form's state, using Date objects for date pickers
type FormState = Omit<Employee, 'date_of_birth' | 'date_joined' | 'employee_status_effective_date' | 'end_of_probation_date' | 'contract_start_date' | 'contract_end_date' | 'termination_date'> & {
    date_of_birth?: Date;
    date_joined?: Date;
    employee_status_effective_date?: Date;
    end_of_probation_date?: Date;
    contract_start_date?: Date;
    contract_end_date?: Date;
    termination_date?: Date;
};


// Helper function to reliably parse raw employee data for the form
const parseDataForForm = (employee: Employee): FormState => {
    // Omit date fields from the spread, then add them back as Date objects
    const {
        date_of_birth,
        date_joined,
        employee_status_effective_date,
        end_of_probation_date,
        contract_start_date,
        contract_end_date,
        termination_date,
        ...rest
    } = employee;

    const parsedData: Partial<FormState> = {
        ...rest,
        date_of_birth: date_of_birth ? new Date(new Date(date_of_birth).getTime() + new Date(date_of_birth).getTimezoneOffset() * 60000) : undefined,
        date_joined: date_joined ? new Date(new Date(date_joined).getTime() + new Date(date_joined).getTimezoneOffset() * 60000) : undefined,
        employee_status_effective_date: employee_status_effective_date ? new Date(new Date(employee_status_effective_date).getTime() + new Date(employee_status_effective_date).getTimezoneOffset() * 60000) : undefined,
        end_of_probation_date: end_of_probation_date ? new Date(new Date(end_of_probation_date).getTime() + new Date(end_of_probation_date).getTimezoneOffset() * 60000) : undefined,
        contract_start_date: contract_start_date ? new Date(new Date(contract_start_date).getTime() + new Date(contract_start_date).getTimezoneOffset() * 60000) : undefined,
        contract_end_date: contract_end_date ? new Date(new Date(contract_end_date).getTime() + new Date(contract_end_date).getTimezoneOffset() * 60000) : undefined,
        termination_date: termination_date ? new Date(new Date(termination_date).getTime() + new Date(termination_date).getTimezoneOffset() * 60000) : undefined,
    };

    // Ensure JSON fields are always arrays, even if null in the DB.
    // This fixes the allowance population issue.
    parsedData.allowances_json = Array.isArray(parsedData.allowances_json) ? parsedData.allowances_json : [];
    parsedData.non_cash_benefits_json = Array.isArray(parsedData.non_cash_benefits_json) ? parsedData.non_cash_benefits_json : [];
    parsedData.other_deductions_json = Array.isArray(parsedData.other_deductions_json) ? parsedData.other_deductions_json : [];


    // Convert null values to empty strings to avoid uncontrolled component warnings
    Object.keys(parsedData).forEach(key => {
        const typedKey = key as keyof FormState;
        if (parsedData[typedKey] === null) {
            parsedData[typedKey] = undefined;
        }
    });

    return parsedData as FormState;
};

const EditEmployeePage = () => {
  const { id: employeeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken, logout } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<FormState>>({});
  const stepFormRef = useRef<StepRef>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId || !accessToken) {
        setError("Invalid request parameters.");
        setIsLoadingData(false);
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/employees/${employeeId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setFormData(parseDataForForm(response.data.employee));
      } catch (err: unknown) {
        console.error("Failed to fetch employee data:", err);
        const axiosError = err as AxiosError;
        // Handle token expiration/invalidation
        if (axiosError.response?.status === 401) {
            toast.error("Your session has expired. Please log in again.");
            logout();
            navigate('/login');
        } else {
            setError("Could not load employee data. The employee may not exist.");
            toast.error("Failed to fetch employee data.");
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchEmployee();
  }, [employeeId, accessToken, navigate, logout]);

  const handleNext = async () => {
    if (!stepFormRef.current) return;
    const isValid = await stepFormRef.current.trigger();
    if (isValid) {
      const stepValues = stepFormRef.current.getValues();
      setFormData(prev => ({ ...prev, ...stepValues }));
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please fix the errors on this step to proceed.');
    }
  };

  const handleBack = () => {
    if (stepFormRef.current) {
        const stepValues = stepFormRef.current.getValues();
        setFormData(prev => ({ ...prev, ...stepValues }));
    }
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!stepFormRef.current || !accessToken || !employeeId) return;
    setIsSubmitting(true);
    const isValid = await stepFormRef.current.trigger();
    if (!isValid) {
      toast.error('Please fix errors on the final step before submitting.');
      setIsSubmitting(false);
      return;
    }

    const finalStepData = stepFormRef.current.getValues();
    const dataToSubmit = { ...formData, ...finalStepData };

     // Clean data one last time before submitting to prevent backend errors
    // Define a type for allowance/benefit/deduction items
    type AllowanceItem = { type: string; value: number | string; [key: string]: unknown };

    const cleanedData = {
            ...dataToSubmit,
            allowances_json: ((dataToSubmit.allowances_json || []) as AllowanceItem[]).filter((item) => item.type && item.type.trim() !== '').map((item) => ({...item, value: parseFloat(String(item.value)) || 0})),
            non_cash_benefits_json: ((dataToSubmit.non_cash_benefits_json || []) as AllowanceItem[]).filter((item) => item.type && item.type.trim() !== '').map((item) => ({...item, value: parseFloat(String(item.value)) || 0})),
            other_deductions_json: ((dataToSubmit.other_deductions_json || []) as AllowanceItem[]).filter((item) => item.type && item.type.trim() !== '').map((item) => ({...item, value: parseFloat(String(item.value)) || 0})),
        };
    try {
      await axios.put(`${API_BASE_URL}/employees/${employeeId}`, cleanedData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success('Employee updated successfully!');
      navigate('/employee');
    } catch (err) {
      console.error("Error updating employee:", err);
      const errorMsg = (axios.isAxiosError(err) && err.response?.data?.error) || 'Failed to update employee.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1]?.component;

  if (isLoadingData) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-[#7F5EFD]" /></div>;
  }
  
  if (error) {
    return <div className="flex h-screen flex-col items-center justify-center text-red-500"><p>{error}</p><Button asChild variant="link" className="mt-4"><Link to="/login">Go to Login</Link></Button></div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <SideNav />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* The key prop here is crucial. It forces the form to re-render when formData is loaded. */}
        <Card className="shadow-lg" key={JSON.stringify(formData)}>
          <CardHeader>
            <div className="flex items-center mb-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/employee')} className="mr-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold text-center flex-1">Edit {formData.first_name}'s Profile</CardTitle>
            </div>
            {/* Step indicator */}
            <div className="flex justify-between items-start w-full max-w-2xl mx-auto mt-6">
                {STEPS.map((step) => (
                  <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center text-center w-24">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 ${currentStep >= step.number ? 'bg-[#7F5EFD]' : 'bg-gray-300'}`}>{currentStep > step.number ? '✔' : step.number}</div>
                      <p className={`mt-2 text-sm font-medium transition-colors duration-300 ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</p>
                    </div>
                    {step.number < STEPS.length && <div className={`flex-1 h-1 mt-5 mx-2 transition-colors duration-300 ${currentStep > step.number ? 'bg-[#7F5EFD]' : 'bg-gray-300'}`} />}
                  </React.Fragment>
                ))}
              </div>
          </CardHeader>
          <CardContent>
            <div className="py-6">
              {CurrentStepComponent ? (
                // @ts-expect-error - This is a known pattern where TS struggles with union type refs. It's safe.
                <CurrentStepComponent ref={stepFormRef} defaultValues={formData} />
              ) : null}
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isSubmitting}>Back</Button>
              {currentStep < STEPS.length ? (
                <Button onClick={handleNext} className="bg-[#7F5EFD] hover:bg-[#6a4fdd]">Next</Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-[#7F5EFD] hover:bg-[#6a4fdd]" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditEmployeePage;
