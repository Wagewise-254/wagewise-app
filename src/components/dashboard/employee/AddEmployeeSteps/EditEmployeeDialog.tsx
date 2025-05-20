// src/components/dashboard/employee/AddEmployeeSteps/EditEmployeeDialog.tsx

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form'; // Keep useFormState
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react'; // Icon for loading
import { DateTime } from 'luxon'; // Import Luxon

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Import DialogFooter
import { Button } from '@/components/ui/button';

// Import the step components (reusing the ones from AddEmployeeDialog)
// Assuming these are in the same AddEmployeeSteps directory
import AddEmployeeStep1 from './AddEmployeeStep1';
import AddEmployeeStep2 from './AddEmployeeStep2';
import AddEmployeeStep3 from './AddEmployeeStep3';


import { API_BASE_URL } from '@/config'; // Adjust path as needed
import useAuthStore from '@/store/authStore'; // Import auth store to get access token

// Define the form data structure (must match the AddEmployeeFormData interface)
// This ensures consistency between Add and Edit forms
interface EditEmployeeFormData {
    employee_number: string;
    first_name: string;
    last_name: string;
    other_names?: string | null;
    email?: string | null;
    phone: string;
    id_type: string;
    id_number: string;
    kra_pin: string;
    shif_number?: string | null;
    nssf_number?: string | null;
    date_of_birth: Date | undefined;
    gender: string;
    marital_status?: string | null;
    citizenship?: string | null;
    has_disability?: boolean | null; // Allow null for boolean from backend
    date_joined: Date | undefined;
    job_title?: string | null;
    department?: string | null;
    job_type: string;
    employee_status: string;
    employee_status_effective_date?: Date | undefined;
    end_of_probation_date?: Date | undefined;
    contract_start_date?: Date | undefined;
    contract_end_date?: Date | undefined;
    termination_date?: Date | undefined;
    termination_reason?: string | null;
    basic_salary: number;
    salary_effective_date?: Date | undefined;
    payment_method: string;
    bank_name?: string | null;
    bank_branch?: string | null;
    bank_code?: string | null;
    bank_account_number?: string | null;
    mpesa_phone_number?: string | null;
    is_helb_paying?: boolean | null;
    benefits?: boolean | null;
    extra_deductions?: boolean | null;
    paye_tax_exemption?: boolean | null;
    disability_tax_exemption?: boolean | null;
    physical_address?: string | null;
    postal_address?: string | null;
    county?: string | null;
    postal_code?: string | null;
    next_of_kin_name?: string | null;
    next_of_kin_relationship?: string | null;
    next_of_kin_phone?: string | null;
}

// Define the type for the employee data passed to the dialog
// This should match the structure of the Employee type from EmployeeTable
interface EmployeeDataForEdit {
    id: string; // Employee ID is required for update
    employee_number: string;
    first_name: string;
    last_name: string;
    other_names?: string | null;
    email?: string | null;
    phone: string;
    id_type: string;
    id_number: string;
    kra_pin: string;
    shif_number?: string | null;
    nssf_number?: string | null;
    date_of_birth?: string | null; // Dates might come as strings from backend
    gender: string;
    marital_status?: string | null;
    citizenship?: string | null;
    has_disability?: boolean | null;
    date_joined?: string | null; // Dates might be strings from backend
    job_title?: string | null;
    department?: string | null;
    job_type: string;
    employee_status: string;
    employee_status_effective_date?: string | null; // Dates might be strings from backend
    end_of_probation_date?: string | null;
    contract_start_date?: string | null;
    contract_end_date?: string | null;
    termination_date?: string | null;
    termination_reason?: string | null;
    basic_salary: number;
    salary_effective_date?: string | null;
    payment_method: string;
    bank_name?: string | null;
    bank_branch?: string | null;
    bank_code?: string | null;
    bank_account_number?: string | null;
    mpesa_phone_number?: string | null;
    is_helb_paying?: boolean | null;
    benefits?: boolean | null;
    extra_deductions?: boolean | null;
    paye_tax_exemption?: boolean | null;
    disability_tax_exemption?: boolean | null;
    physical_address?: string | null;
    postal_address?: string | null;
    county?: string | null;
    postal_code?: string | null;
    next_of_kin_name?: string | null;
    next_of_kin_relationship?: string | null;
    next_of_kin_phone?: string | null;
}


interface EditEmployeeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employeeData: EmployeeDataForEdit | null; // Data of the employee to edit
    onEmployeeUpdated?: () => void; // Optional callback after successful update
}

const TOTAL_STEPS = 3; // Define the total number of steps

const EditEmployeeDialog: React.FC<EditEmployeeDialogProps> = ({ isOpen, onClose, employeeData, onEmployeeUpdated }) => {
    const { accessToken } = useAuthStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Initialize react-hook-form methods
    const methods = useForm<EditEmployeeFormData>({
        mode: 'onTouched',
        defaultValues: {
            // Set default values from employeeData when it changes
            // Use useEffect to reset the form when employeeData changes
        }
    });

    // Destructure methods and use useFormState for errors
    const {
        handleSubmit,
        trigger,
        reset, // Use reset to populate form on edit
        // control, // control is not directly used here, but needed by FormProvider
        formState: { errors }, // Get latest errors
    } = methods; // Destructure errors from formState

    // Effect to reset the form when the dialog opens or employeeData changes
    useEffect(() => {
        if (isOpen && employeeData) {
            // Map backend string dates to Date objects for the form
            const formattedData = {
                ...employeeData,
                date_of_birth: employeeData.date_of_birth ? DateTime.fromISO(employeeData.date_of_birth).toJSDate() : undefined,
                date_joined: employeeData.date_joined ? DateTime.fromISO(employeeData.date_joined).toJSDate() : undefined,
                employee_status_effective_date: employeeData.employee_status_effective_date ? DateTime.fromISO(employeeData.employee_status_effective_date).toJSDate() : undefined,
                end_of_probation_date: employeeData.end_of_probation_date ? DateTime.fromISO(employeeData.end_of_probation_date).toJSDate() : undefined,
                contract_start_date: employeeData.contract_start_date ? DateTime.fromISO(employeeData.contract_start_date).toJSDate() : undefined,
                contract_end_date: employeeData.contract_end_date ? DateTime.fromISO(employeeData.contract_end_date).toJSDate() : undefined,
                termination_date: employeeData.termination_date ? DateTime.fromISO(employeeData.termination_date).toJSDate() : undefined,
                salary_effective_date: employeeData.salary_effective_date ? DateTime.fromISO(employeeData.salary_effective_date).toJSDate() : undefined,
                 // Ensure boolean fields are true/false, not null
                 has_disability: employeeData.has_disability ?? false,
                 is_helb_paying: employeeData.is_helb_paying ?? false,
                 benefits: employeeData.benefits ?? false,
                 extra_deductions: employeeData.extra_deductions ?? false,
                 paye_tax_exemption: employeeData.paye_tax_exemption ?? false,
                 disability_tax_exemption: employeeData.disability_tax_exemption ?? false,
                 // Ensure numeric fields are numbers
                 basic_salary: employeeData.basic_salary ?? 0,
                 // Ensure string fields are strings or null, not undefined if they were null from backend
                 other_names: employeeData.other_names || null,
                 email: employeeData.email || null,
                 shif_number: employeeData.shif_number || null,
                 nssf_number: employeeData.nssf_number || null,
                 marital_status: employeeData.marital_status || null,
                 citizenship: employeeData.citizenship || null,
                 job_title: employeeData.job_title || null,
                 department: employeeData.department || null,
                 termination_reason: employeeData.termination_reason || null,
                 bank_name: employeeData.bank_name || null,
                 bank_branch: employeeData.bank_branch || null,
                 bank_code: employeeData.bank_code || null,
                 bank_account_number: employeeData.bank_account_number || null,
                 mpesa_phone_number: employeeData.mpesa_phone_number || null,
                 physical_address: employeeData.physical_address || null,
                 postal_address: employeeData.postal_address || null,
                 county: employeeData.county || null,
                 postal_code: employeeData.postal_code || null,
                 next_of_kin_name: employeeData.next_of_kin_name || null,
                 next_of_kin_relationship: employeeData.next_of_kin_relationship || null,
                 next_of_kin_phone: employeeData.next_of_kin_phone || null,

            };
            reset(formattedData as EditEmployeeFormData); // Populate the form with data
            setCurrentStep(1); // Reset to the first step
            setFormError(null); // Clear any previous errors
        } else if (!isOpen) {
            // Reset form when dialog closes
            reset();
            setCurrentStep(1);
            setIsSubmitting(false); // Ensure submitting state is reset
            setFormError(null);
        }
    }, [isOpen, employeeData, reset]);


    // Function to handle Next button click
    const handleNext = async () => {
        setFormError(null); // Clear error before validating step

        let fieldsToValidate: (keyof EditEmployeeFormData)[] = [];
        // Define fields to validate for each step (same as Add dialog)
        if (currentStep === 1) {
            fieldsToValidate = [
                'employee_number', 'first_name', 'last_name', 'phone', 'id_type',
                'id_number', 'kra_pin', 'date_of_birth', 'gender', 'date_joined',
                'job_type', 'employee_status', 'basic_salary', 'payment_method'
            ];
        } else if (currentStep === 2) {
             // Add required fields for step 2 here if you have any
             fieldsToValidate = []; // Assuming no required fields just for navigation
        }
        // Step 3 fields are validated on final submit

        // Trigger validation for the current step's fields
        await trigger(fieldsToValidate, { shouldFocus: true });

        // After triggering validation, check the errors object for any errors
        const hasErrorsInCurrentStep = fieldsToValidate.some(field => errors[field]);

        if (!hasErrorsInCurrentStep) {
            setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
        } else {
             const specificErrors = fieldsToValidate
                 .map(field => errors[field]?.message)
                 .filter(Boolean)
                 .join(' ');

             setFormError(specificErrors || "Please fill out all required fields correctly before proceeding.");
        }
    };

    // Function to handle Previous button click
    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
        setFormError(null); // Clear error when going back
    };

    // Function to handle final form submission (Update)
    const onSubmit: SubmitHandler<EditEmployeeFormData> = async (data) => {
        if (!employeeData?.id) {
             setFormError("Employee ID is missing for update.");
             toast.error("Employee ID missing for update.");
             return;
        }

        setIsSubmitting(true);
        setFormError(null); // Reset local form error

        //  // Final validation for step 3 fields before submitting
        //  const step3Fields: (keyof EditEmployeeFormData)[] = [
        //      'payroll_frequency', 'default_work_days', 'default_work_hours',
        //      'nssf_scheme', 'shif_rate_option'
        //  ];
        //  const isStep3Valid = await trigger(step3Fields, { shouldFocus: true });

        //  if (!isStep3Valid) {
        //      setIsSubmitting(false);
        //       const specificErrors = step3Fields
        //          .map(field => errors[field]?.message)
        //          .filter(Boolean)
        //          .join(' ');
        //      setFormError(specificErrors || "Please fill out all required fields in the final step.");
        //      return; // Stop submission if step 3 is invalid
        //  }


        if (!accessToken) {
             setFormError("Authentication token is missing. Please log in again.");
             toast.error("Authentication token missing.");
             setIsSubmitting(false);
             return;
        }

        try {
            // Format date fields to 'YYYY-MM-DD' strings using Luxon before sending
            const formattedData = {
                ...data,
                date_of_birth: data.date_of_birth ? DateTime.fromJSDate(data.date_of_birth).toFormat('yyyy-MM-dd') : null,
                date_joined: data.date_joined ? DateTime.fromJSDate(data.date_joined).toFormat('yyyy-MM-dd') : null,
                employee_status_effective_date: data.employee_status_effective_date ? DateTime.fromJSDate(data.employee_status_effective_date).toFormat('yyyy-MM-dd') : null,
                end_of_probation_date: data.end_of_probation_date ? DateTime.fromJSDate(data.end_of_probation_date).toFormat('yyyy-MM-dd') : null,
                contract_start_date: data.contract_start_date ? DateTime.fromJSDate(data.contract_start_date).toFormat('yyyy-MM-dd') : null,
                contract_end_date: data.contract_end_date ? DateTime.fromJSDate(data.contract_end_date).toFormat('yyyy-MM-dd') : null,
                termination_date: data.termination_date ? DateTime.fromJSDate(data.termination_date).toFormat('yyyy-MM-dd') : null,
                salary_effective_date: data.salary_effective_date ? DateTime.fromJSDate(data.salary_effective_date).toFormat('yyyy-MM-dd') : null,
                // Ensure optional boolean fields are sent as boolean or null
                has_disability: data.has_disability ?? null,
                is_helb_paying: data.is_helb_paying ?? null,
                benefits: data.benefits ?? null,
                extra_deductions: data.extra_deductions ?? null,
                paye_tax_exemption: data.paye_tax_exemption ?? null,
                disability_tax_exemption: data.disability_tax_exemption ?? null,
                 // Ensure optional string fields are sent as string or null
                 other_names: data.other_names || null,
                 email: data.email || null,
                 shif_number: data.shif_number || null,
                 nssf_number: data.nssf_number || null,
                 marital_status: data.marital_status || null,
                 citizenship: data.citizenship || null,
                 job_title: data.job_title || null,
                 department: data.department || null,
                 termination_reason: data.termination_reason || null,
                 bank_name: data.bank_name || null,
                 bank_branch: data.bank_branch || null,
                 bank_code: data.bank_code || null,
                 bank_account_number: data.bank_account_number || null,
                 mpesa_phone_number: data.mpesa_phone_number || null,
                 physical_address: data.physical_address || null,
                 postal_address: data.postal_address || null,
                 county: data.county || null,
                 postal_code: data.postal_code || null,
                 next_of_kin_name: data.next_of_kin_name || null,
                 next_of_kin_relationship: data.next_of_kin_relationship || null,
                 next_of_kin_phone: data.next_of_kin_phone || null,
                 // Ensure numeric fields are numbers or null
                 basic_salary: data.basic_salary ?? null,
            };


            // Send the updated data to the backend API using PUT
            const response = await axios.put(`${API_BASE_URL}/employees/${employeeData.id}`, formattedData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            console.log("Employee updated successfully:", response.data);

            toast.success(response.data.message || "Employee updated successfully!");
            onEmployeeUpdated?.(); // Optional callback to trigger table refetch
            handleCloseDialog(); // Close the dialog

        } catch (err: unknown) {
            console.error("Error updating employee:", err);

            if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
                interface ErrorResponse {
                    error?: string;
                    message?: string;
                    details?: Record<string, unknown>;
                }
                const backendError = err.response.data as ErrorResponse;
                const backendErrorMessage = backendError.error || backendError.message || "Failed to update employee.";

                setFormError(backendErrorMessage);
                toast.error(backendErrorMessage);

                if (backendError.details) {
                    console.error("Update Employee Details:", backendError.details);
                    // You might want to display these details to the user
                }

            } else {
                const genericErrorMessage = "An unexpected error occurred while updating employee.";
                setFormError(genericErrorMessage);
                toast.error(genericErrorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render the current step's component
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <AddEmployeeStep1 />; // Reuse Step 1 component
            case 2:
                return <AddEmployeeStep2 />; // Reuse Step 2 component
            case 3:
                return <AddEmployeeStep3 />; // Reuse Step 3 component
            default:
                return null;
        }
    };

    // Progress Indicator
    const renderProgressIndicator = () => (
        <div className="flex justify-center space-x-2 mb-6">
            {[...Array(TOTAL_STEPS)].map((_, index) => (
                <div
                    key={index}
                    className={`h-2 w-8 rounded-full ${
                        index + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                ></div>
            ))}
        </div>
    );

    // Reset form and state when dialog closes
    const handleCloseDialog = () => {
        reset(); // Reset react-hook-form state
        setCurrentStep(1); // Go back to step 1
        setIsSubmitting(false);
        setFormError(null);
        onClose(); // Call parent onClose
    };


    return (
        // Wrap the form content with FormProvider
        <FormProvider {...methods}>
            {/* Only render the Dialog when isOpen is true and employeeData is available */}
            {isOpen && employeeData && (
                <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
                    <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Edit Employee</DialogTitle>
                            <DialogDescription>
                                Update the details for the employee.
                            </DialogDescription>
                        </DialogHeader>

                        {renderProgressIndicator()}

                        {formError && <p className="text-red-500 text-sm mb-4 text-center">{formError}</p>}

                        {/* Use react-hook-form's handleSubmit for the form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {renderStepContent()}

                            {/* Wrap buttons in DialogFooter */}
                            <DialogFooter className="mt-6">
                                {currentStep > 1 && (
                                    <Button type="button" variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
                                        Previous
                                    </Button>
                                )}
                                {currentStep < TOTAL_STEPS && (
                                    <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                                        Next
                                    </Button>
                                )}
                                {currentStep === TOTAL_STEPS && (
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                                        {isSubmitting ? 'Updating Employee...' : 'Update Employee'}
                                    </Button>
                                )}
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </FormProvider>
    );
};

export default EditEmployeeDialog;
