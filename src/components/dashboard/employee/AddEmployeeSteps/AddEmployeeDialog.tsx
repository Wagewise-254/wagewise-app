// src/components/dashboard/employee/AddEmployeeDialog.tsx - Main Add Employee Dialog

import React, { useState } from 'react';
import { useForm, SubmitHandler, FormProvider, useFormState } from 'react-hook-form'; // Import FormProvider and useFormState
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react'; // Icon for loading

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Import the step components
import AddEmployeeStep1 from './AddEmployeeStep1';
import AddEmployeeStep2 from './AddEmployeeStep2';
import AddEmployeeStep3 from './AddEmployeeStep3';


import { API_BASE_URL } from '@/config'; // Adjust path as needed
import useAuthStore from '@/store/authStore'; // Import auth store to get access token

// Import Luxon for date formatting
import { DateTime } from 'luxon';


// Define the form data structure based on your employees table
// Use types that match the form inputs (strings for text, numbers for number inputs, booleans for checkboxes, Date objects for date pickers)
interface AddEmployeeFormData {
    employee_number: string;
    first_name: string;
    last_name: string;
    other_names?: string; // Optional
    email?: string; // Optional
    phone: string;
    id_type: string;
    id_number: string;
    kra_pin: string;
    shif_number?: string; // Optional
    nssf_number?: string; // Optional
    date_of_birth: Date | undefined; // Use Date type for date picker, can be undefined initially
    gender: string;
    marital_status?: string; // Optional
    citizenship?: string; // Optional, backend has default
    has_disability?: boolean; // Optional, backend has default
    date_joined: Date | undefined; // Use Date type for date picker, can be undefined initially
    job_title?: string; // Optional
    department?: string; // Optional
    job_type: string;
    employee_status: string;
    employee_status_effective_date?: Date | undefined; // Optional
    end_of_probation_date?: Date | undefined; // Optional
    contract_start_date?: Date | undefined; // Optional
    contract_end_date?: Date | undefined; // Optional
    termination_date?: Date | undefined; // Optional
    termination_reason?: string; // Optional
    basic_salary: number; // Use number type
    salary_effective_date?: Date | undefined; // Optional
    // payroll_frequency: string; // Required in this step
    // default_work_days: number; // Required in this step
    // default_work_hours: number; // Required in this step
    // nssf_scheme: string; // Required in this step
    // shif_rate_option: string; // Required in this step
    payment_method: string;
    bank_name?: string; // Optional
    bank_branch?: string; // Optional
    bank_code?: string; // Optional
    bank_account_number?: string; // Optional
    mpesa_phone_number?: string; // Optional
    is_helb_paying?: boolean; // Optional, backend has default
    benefits?: boolean; // Optional, backend has default
    extra_deductions?: boolean; // Optional, backend has default
    paye_tax_exemption?: boolean; // Optional, backend has default
    disability_tax_exemption?: boolean; // Optional, backend has default
    physical_address?: string; // Optional
    postal_address?: string; // Optional
    county?: string; // Optional
    postal_code?: string; // Optional
    next_of_kin_name?: string; // Optional
    next_of_kin_relationship?: string; // Optional
    next_of_kin_phone?: string; // Optional
    logo?: string; // Optional
}


interface AddEmployeeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onEmployeeAdded?: () => void; // Optional callback after successful add
}

const TOTAL_STEPS = 3; // Define the total number of steps

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({ isOpen, onClose, onEmployeeAdded }) => {
    const { accessToken } = useAuthStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Initialize react-hook-form methods
    const methods = useForm<AddEmployeeFormData>({
        mode: 'onTouched',
        defaultValues: {
            employee_number: '',
            first_name: '',
            last_name: '',
            other_names: '',
            email: '',
            phone: '',
            id_type: '',
            id_number: '',
            kra_pin: '',
            shif_number: '',
            nssf_number: '',
            date_of_birth: undefined, // Default to undefined for Date picker
            gender: '',
            marital_status: '',
            citizenship: 'Kenyan',
            has_disability: false,
            date_joined: undefined, // Default to undefined for Date picker
            job_title: '',
            department: '',
            job_type: '',
            employee_status: '',
            employee_status_effective_date: undefined,
            end_of_probation_date: undefined,
            contract_start_date: undefined,
            contract_end_date: undefined,
            termination_date: undefined,
            termination_reason: '',
            basic_salary: 0,
            salary_effective_date: undefined,
            // payroll_frequency: '',
            // default_work_days: 5, // Default value
            // default_work_hours: 8, // Default value
            // nssf_scheme: '',
            // shif_rate_option: '',
            payment_method: '',
            bank_name: '',
            bank_branch: '',
            bank_code: '',
            bank_account_number: '',
            mpesa_phone_number: '',
            is_helb_paying: false,
            benefits: false,
            extra_deductions: false,
            paye_tax_exemption: false,
            disability_tax_exemption: false,
            physical_address: '',
            postal_address: '',
            county: '',
            postal_code: '',
            next_of_kin_name: '',
            next_of_kin_relationship: '',
            next_of_kin_phone: '',
            //logo: '',
        }
    });

    // Destructure methods and use useFormState for errors
    const {
        handleSubmit,
        trigger,
        reset,
        control, // Need control for useFormState and Controller in steps
    } = methods;

    const { errors } = useFormState({ control }); // Get latest errors


    // Function to handle Next button click
    const handleNext = async () => {
        setFormError(null); // Clear error before validating step

        let fieldsToValidate: (keyof AddEmployeeFormData)[] = [];
        // Define fields to validate for each step
        if (currentStep === 1) {
            fieldsToValidate = [
                'employee_number', 'first_name', 'last_name', 'phone', 'id_type',
                'id_number', 'kra_pin', 'date_of_birth', 'gender', 'date_joined',
                'job_type', 'employee_status', 'basic_salary', 'payment_method'
            ];
        } else if (currentStep === 2) {
             // Add required fields for step 2 here if you have any
             // fieldsToValidate = ['physical_address', 'county']; // Example
             // If step 2 has no *required* fields for navigation, fieldsToValidate can be empty
             fieldsToValidate = []; // Assuming no required fields just for navigation
        }
        // Step 3 fields are validated on final submit

        // Trigger validation for the current step's fields
        // Pass the fields to validate based on the current step
        await trigger(fieldsToValidate, { shouldFocus: true });

        // After triggering validation, check the errors object for any errors
        // in the fields we just tried to validate.
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

    // Function to handle final form submission
    const onSubmit: SubmitHandler<AddEmployeeFormData> = async (data) => {
        setIsSubmitting(true);
        setFormError(null); // Reset local form error

        //  // Final validation for step 3 fields before submitting
        //  const step3Fields: (keyof AddEmployeeFormData)[] = [
        //      'payroll_frequency', 'default_work_days', 'default_work_hours',
        //      'nssf_scheme', 'shif_rate_option'
        //      // Add any other required fields from step 3 here
        //  ];
         //const isStep3Valid = await trigger(step3Fields, { shouldFocus: true });

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
                // Ensure optional boolean fields are sent as boolean or undefined/null
                has_disability: data.has_disability,
                is_helb_paying: data.is_helb_paying,
                benefits: data.benefits,
                extra_deductions: data.extra_deductions,
                paye_tax_exemption: data.paye_tax_exemption,
                disability_tax_exemption: data.disability_tax_exemption,
                // Ensure optional string fields are sent as string or undefined/null
                 other_names: data.other_names || null,
                 email: data.email || null,
                 shif_number: data.shif_number || null,
                 nssf_number: data.nssf_number || null,
                 marital_status: data.marital_status || null,
                 citizenship: data.citizenship || null, // Let backend apply default if null
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
                 //logo: data.logo || null,
            };


            // Send the collected data to the backend API
            const response = await axios.post(`${API_BASE_URL}/employees`, formattedData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            console.log("Employee added successfully:", response.data);

            toast.success(response.data.message || "Employee added successfully!");
            onEmployeeAdded?.(); // Optional callback
            handleCloseDialog(); // Close the dialog

        } catch (err: unknown) {
            console.error("Error adding employee:", err);

            if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
                interface ErrorResponse {
                    error?: string;
                    message?: string;
                    details?: Record<string, unknown>; // Replace 'any' with a more specific type
                }
                const backendError = err.response.data as ErrorResponse;
                const backendErrorMessage = backendError.error || backendError.message || "Failed to add employee.";

                setFormError(backendErrorMessage);
                toast.error(backendErrorMessage);

                if (backendError.details) {
                    console.error("Add Employee Details:", backendError.details);
                    // You might want to display these details to the user
                }

            } else {
                const genericErrorMessage = "An unexpected error occurred while adding employee.";
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
                return <AddEmployeeStep1 />;
            case 2:
                return <AddEmployeeStep2 />;
            case 3:
                return <AddEmployeeStep3 />;
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
            <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Add New Employee</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new employee.
                        </DialogDescription>
                    </DialogHeader>

                    {renderProgressIndicator()}

                    {formError && <p className="text-red-500 text-sm mb-4 text-center">{formError}</p>}

                    {/* Use react-hook-form's handleSubmit for the form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {renderStepContent()}

                        <div className="flex justify-between mt-6">
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
                                    {isSubmitting ? 'Adding Employee...' : 'Add Employee'}
                                </Button>
                            )}
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </FormProvider> 
    );
};

export default AddEmployeeDialog;
