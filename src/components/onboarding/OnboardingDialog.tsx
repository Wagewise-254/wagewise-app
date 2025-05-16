// src/components/onboarding/OnboardingDialog.tsx - Functional Multi-Step Form

import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller, useFormState } from 'react-hook-form';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming this now correctly forwards refs
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Assuming this now correctly forwards refs

import { API_BASE_URL } from '@/config'; // Adjust path as needed for your API endpoint
import useAuthStore from '@/store/authStore'; // Import auth store to get access token

// Define the form data structure based on your table (excluding id, user_id, timestamps)
interface OnboardingFormData {
    business_name: string;
    business_type: string;
    industry: string;
    kra_pin: string;
    reg_number: string;
    company_email: string;
    company_phone: string;
    address: string;
    county: string;
    payroll_frequency: string;
    default_work_days: number;
    default_work_hours: number;
    nssf_scheme: string;
    shif_rate_option: string;
    logo?: string; // Optional field (assuming this would be a URL for now)
}

interface OnboardingDialogProps {
    onOnboardingComplete: () => void; // Callback function for successful onboarding
    isOpen: boolean; // Controls dialog visibility
    onClose: () => void; // Function to close the dialog
}

const TOTAL_STEPS = 3; // Define the total number of steps in the form

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ onOnboardingComplete, isOpen, onClose }) => {
    // Get the access token from your authentication store
    const { accessToken } = useAuthStore();

    // State to manage the current step of the multi-step form
    const [currentStep, setCurrentStep] = useState(1);
    // State to indicate if the form is currently submitting
    const [isSubmitting, setIsSubmitting] = useState(false);
    // State to hold and display a general form error message
    const [formError, setFormError] = useState<string | null>(null);

    // Initialize react-hook-form
    const methods = useForm<OnboardingFormData>({
        mode: 'onTouched', // Validate fields when they are touched and blurred
        defaultValues: { // Set initial values for form fields
            business_name: '',
            business_type: '',
            industry: '',
            kra_pin: '',
            reg_number: '',
            company_email: '',
            company_phone: '',
            address: '',
            county: '',
            payroll_frequency: '',
            nssf_scheme: '',
            shif_rate_option: '',
            default_work_days: 5, // Default number values
            default_work_hours: 8, // Default number values
            // logo is optional, no default needed unless you have one
        }
    });

    // Destructure necessary functions from the useForm methods
    const {
        register, // Function to register input fields with RHF
        handleSubmit, // Function to handle form submission (runs validation before calling onSubmit)
        trigger, // Function to manually trigger validation for specific fields
        control, // Object needed for the Controller component (for integrating external components like Select)
        // getValues, // Useful for debugging, but not strictly needed for logic here
        // setValue, // Not needed for this implementation
        // reset, // Can be used to reset the form after submission
    } = methods;

    // useFormState hook to get the latest form state, including errors, for rendering purposes
    // This hook ensures the component re-renders when errors change.
    const { errors } = useFormState({ control });

    // Function to handle the "Next" button click
    const handleNext = async () => {
        setFormError(null); // Clear any previous general form error

        // Define which fields to validate based on the current step
        let fieldsToValidate: (keyof OnboardingFormData)[] = [];
        if (currentStep === 1) {
            fieldsToValidate = ['business_name', 'business_type', 'industry', 'kra_pin', 'reg_number'];
        } else if (currentStep === 2) {
            fieldsToValidate = ['company_email', 'company_phone', 'address', 'county'];
        }
        // Note: Step 3 fields are validated automatically by handleSubmit on the final step

        // Trigger validation for the fields defined for the current step.
        // The 'trigger' function returns a boolean: true if validation passed for ALL triggered fields, false otherwise.
        const isStepValid = await trigger(fieldsToValidate, { shouldFocus: true });

        // Check the result of the validation trigger
        if (isStepValid) {
            // If validation passed for all fields in the current step, move to the next step
            setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
        } else {
            // If validation failed, react-hook-form will update the 'errors' state (via useFormState),
            // causing the specific error messages to appear next to the fields.
            // We can also set a general error message here.
             setFormError("Please fix the errors in this step before proceeding.");
            // Optionally, build a message from specific errors if preferred:
            // const specificErrors = fieldsToValidate
            //     .map(field => errors[field]?.message)
            //     .filter(Boolean) // Filter out undefined/null messages
            //     .join(' '); // Join multiple error messages
            // setFormError(specificErrors || "Please fix the errors in this step before proceeding.");
        }
    };

    // Function to handle the "Previous" button click
    const handlePrevious = () => {
        // Move to the previous step, ensuring we don't go below step 1
        setCurrentStep((prev) => Math.max(prev - 1, 1));
        setFormError(null); // Clear any general form error when going back
    };

    // Function to handle the final form submission (called by handleSubmit after all fields are valid)
    const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
        setIsSubmitting(true); // Set submitting state to true
        setFormError(null); // Reset local form error

        // Check if the authentication token is available
        if (!accessToken) {
            setFormError("Authentication token is missing. Please log in again.");
            toast.error("Authentication token missing.");
            setIsSubmitting(false);
            // Consider redirecting the user to the login page here if necessary
            return;
        }

        try {
            // Send the collected form data to the backend API endpoint
            const response = await axios.post(`${API_BASE_URL}/company`, data, {
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Include the access token for authentication
                },
            });

            console.log("Onboarding data saved:", response.data);

            // On successful API response
            toast.success("Company details saved successfully!"); // Show success notification
            onOnboardingComplete(); // Call the parent component's callback for completion
            // reset(); // Optionally reset the form fields after successful submission
            onClose(); // Close the dialog

        } catch (err: unknown) {
            console.error("Error saving company details:", err); // Log the error

            // Handle Axios errors specifically to extract backend error messages
            if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
                interface ErrorResponse {
                    error?: string; // Common field for error messages
                    message?: string; // Another common field for error messages
                    // Add other potential backend error fields if known
                }
                // Attempt to get a meaningful error message from the backend response
                const backendErrorMessage = (err.response.data as ErrorResponse)?.error || (err.response.data as ErrorResponse)?.message || "Failed to save company details.";
                setFormError(backendErrorMessage); // Set the general form error state
                toast.error(backendErrorMessage); // Show error notification
            } else {
                // Handle non-Axios errors or unexpected response formats
                const genericErrorMessage = "An unexpected error occurred while saving details.";
                setFormError(genericErrorMessage);
                toast.error(genericErrorMessage);
            }
        } finally {
            setIsSubmitting(false); // Reset submitting state regardless of success or failure
        }
    };

    // Helper function to render the progress indicator dots
    const renderProgressIndicator = () => (
        <div className="flex justify-center space-x-2 mb-6">
            {[...Array(TOTAL_STEPS)].map((_, index) => (
                <div
                    key={index}
                    className={`h-2 w-8 rounded-full ${
                        // Highlight the dot if the step is completed or is the current step
                        index + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                ></div>
            ))}
        </div>
    );

    // Helper function to render the content (form fields) for the current step
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-2">Business Information</h3>
                        <div>
                            <Label className='mb-2' htmlFor="business_name">Business Name</Label>
                            {/* Register Input field with RHF and add required validation rule */}
                            <Input id="business_name" {...register("business_name", { required: "Business Name is required" })} />
                            {/* Display error message if validation fails for this field */}
                            {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="business_type">Business Type</Label>
                             {/* Use Controller for Shadcn Select as it's a controlled component */}
                             <Controller
                                name="business_type"
                                control={control} // Pass the control object from useForm
                                rules={{ required: "Business Type is required" }} // Add validation rules
                                render={({ field }) => ( // Render prop provides field props (value, onChange, etc.)
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select business type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                                            <SelectItem value="partnership">Partnership</SelectItem>
                                            <SelectItem value="limited_company">Limited Company</SelectItem>
                                            <SelectItem value="non_profit">Non-Profit</SelectItem>
                                            <SelectItem value="cooperative">Cooperative</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>

                                            {/* Add more options as needed */}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.business_type && <p className="text-red-500 text-sm mt-1">{errors.business_type.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="industry">Industry</Label>
                             <Controller
                                name="industry"
                                control={control}
                                rules={{ required: "Industry is required" }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="technology">Technology</SelectItem>
                                            <SelectItem value="finance">Finance</SelectItem>
                                            <SelectItem value="healthcare">Healthcare</SelectItem>
                                            <SelectItem value="education">Education</SelectItem>
                                            <SelectItem value="retail">Retail</SelectItem>
                                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                            <SelectItem value="hospitality">Hospitality</SelectItem>
                                            <SelectItem value="agriculture">Agriculture</SelectItem>
                                            <SelectItem value="construction">Construction</SelectItem>
                                            <SelectItem value="transportation">Transportation</SelectItem>
                                            <SelectItem value="real_estate">Real Estate</SelectItem>
                                            <SelectItem value="entertainment">Entertainment</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            {/* Add more options as needed */}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="kra_pin">KRA PIN</Label>
                            {/* Register Input field with required validation */}
                            {/* Consider adding a pattern regex for KRA PIN format validation if needed */}
                            <Input id="kra_pin" {...register("kra_pin", { required: "KRA PIN is required" })} />
                             {errors.kra_pin && <p className="text-red-500 text-sm mt-1">{errors.kra_pin.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="reg_number">Registration Number</Label>
                             {/* Register Input field with required validation */}
                             {/* Consider adding a pattern regex for Registration Number format validation if needed */}
                            <Input id="reg_number" {...register("reg_number", { required: "Registration Number is required" })} />
                            {errors.reg_number && <p className="text-red-500 text-sm mt-1">{errors.reg_number.message}</p>}
                        </div>
                        {/* Optional logo field example (assuming URL input) */}
                        {/* <div>
                             <Label htmlFor="logo">Company Logo URL (Optional)</Label>
                             <Input id="logo" {...register("logo")} />
                             {errors.logo && <p className="text-red-500 text-sm mt-1">{errors.logo.message}</p>}
                        </div> */}
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                         <h3 className="text-lg font-semibold mb-2">Contact & Location</h3>
                         <div>
                            <Label className='mb-2' htmlFor="company_email">Company Email</Label>
                             {/* Register Input field with required and email format validation */}
                             <Input
                                id="company_email"
                                type="email"
                                {...register("company_email", {
                                    required: "Company Email is required",
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email regex
                                        message: "Invalid email format"
                                    }
                                })}
                             />
                             {errors.company_email && <p className="text-red-500 text-sm mt-1">{errors.company_email.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="company_phone">Company Phone</Label>
                             {/* Register Input field with required validation */}
                             {/* Consider adding a pattern regex for phone number format validation if needed */}
                             <Input id="company_phone" type="tel" {...register("company_phone", { required: "Company Phone is required" })} />
                             {errors.company_phone && <p className="text-red-500 text-sm mt-1">{errors.company_phone.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="address">Address</Label>
                             {/* Register Textarea field with required validation */}
                             <Textarea id="address" {...register("address", { required: "Address is required" })} />
                             {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="county">County</Label>
                             {/* Use Controller for Shadcn Select with required validation */}
                             <Controller
                                name="county"
                                control={control}
                                rules={{ required: "County is required" }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select county" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kiambu">Kiambu</SelectItem>
                                            <SelectItem value="nairobi">Nairobi</SelectItem>
                                            <SelectItem value="mombasa">Mombasa</SelectItem>
                                            <SelectItem value="nakuru">Nakuru</SelectItem>
                                            <SelectItem value="kisumu">Kisumu</SelectItem>
                                            <SelectItem value="eldoret">Eldoret</SelectItem>
                                            <SelectItem value="meru">Meru</SelectItem>
                                            <SelectItem value="nyeri">Nyeri</SelectItem>
                                            <SelectItem value="machakos">Machakos</SelectItem>
                                            <SelectItem value="nanyuki">Nanyuki</SelectItem>
                                            <SelectItem value="thika">Thika</SelectItem>
                                            <SelectItem value="malindi">Malindi</SelectItem>
                                            <SelectItem value="kilifi">Kilifi</SelectItem>
                                            <SelectItem value="bomet">Bomet</SelectItem>
                                            <SelectItem value="others">Others</SelectItem>
                                            {/* Add more counties */}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county.message}</p>}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-2">Payroll Settings</h3>
                         <div>
                            <Label className='mb-2' htmlFor="payroll_frequency">Payroll Frequency</Label>
                             {/* Use Controller for Shadcn Select with required validation */}
                             <Controller
                                name="payroll_frequency"
                                control={control}
                                rules={{ required: "Payroll Frequency is required" }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            {/* Add more options as needed */}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.payroll_frequency && <p className="text-red-500 text-sm mt-1">{errors.payroll_frequency.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="default_work_days">Default Work Days per Week</Label>
                             {/* Register Input field with required, min, max validation, and valueAsNumber */}
                             <Input
                                id="default_work_days"
                                type="number"
                                {...register("default_work_days", {
                                    required: "Default Work Days is required",
                                    min: { value: 1, message: "Must be at least 1" },
                                    max: { value: 7, message: "Cannot exceed 7" },
                                    valueAsNumber: true, // Ensure the value is parsed as a number
                                })}
                            />
                             {errors.default_work_days && <p className="text-red-500 text-sm mt-1">{errors.default_work_days.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="default_work_hours">Default Work Hours per Day</Label>
                             {/* Register Input field with required, min, max validation, and valueAsNumber */}
                             <Input
                                id="default_work_hours"
                                type="number"
                                {...register("default_work_hours", {
                                    required: "Default Work Hours is required",
                                    min: { value: 1, message: "Must be at least 1" },
                                    max: { value: 24, message: "Cannot exceed 24" },
                                    valueAsNumber: true, // Ensure the value is parsed as a number
                                })}
                            />
                             {errors.default_work_hours && <p className="text-red-500 text-sm mt-1">{errors.default_work_hours.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="nssf_scheme">NSSF Scheme</Label>
                             {/* Use Controller for Shadcn Select with required validation */}
                             <Controller
                                name="nssf_scheme"
                                control={control}
                                rules={{ required: "NSSF Scheme is required" }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select NSSF scheme" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="old">Old Scheme</SelectItem>
                                            <SelectItem value="new">New Scheme</SelectItem>
                                            {/* Add more options if applicable */}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.nssf_scheme && <p className="text-red-500 text-sm mt-1">{errors.nssf_scheme.message}</p>}
                        </div>
                         <div>
                            <Label className='mb-2' htmlFor="shif_rate_option">SHIF Rate Option</Label>
                             {/* Use Controller for Shadcn Select with required validation */}
                             <Controller
                                name="shif_rate_option"
                                control={control}
                                rules={{ required: "SHIF Rate Option is required" }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select SHIF option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tiered">Tiered Rate</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                            {/* Add more options if applicable */}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.shif_rate_option && <p className="text-red-500 text-sm mt-1">{errors.shif_rate_option.message}</p>}
                        </div>
                    </div>
                );
            default:
                return null; // Should not happen if currentStep is managed correctly
        }
    };

    return (
        // Shadcn Dialog component to wrap the form
        <Dialog open={isOpen} onOpenChange={onClose}>
             {/* DialogContent provides the dialog styling and structure */}
             {/* Added overflow-y-auto and max-h-[90vh] for scrollability on smaller screens */}
            <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Complete Your Company Profile</DialogTitle>
                    <DialogDescription>
                        Please provide your company details to set up your payroll.
                    </DialogDescription>
                </DialogHeader>

                {/* Render the progress indicator */}
                {renderProgressIndicator()}

                {/* Display the general form error message if set */}
                {formError && <p className="text-red-500 text-sm mb-4 text-center">{formError}</p>}

                {/* The main form element. handleSubmit manages RHF validation and calls onSubmit */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Render the content (form fields) for the current step */}
                    {renderStepContent()}

                    {/* Navigation buttons section */}
                    <div className="flex justify-between mt-6">
                        {/* Previous Button: Visible on steps > 1 */}
                        {currentStep > 1 && (
                            <Button type="button" variant="outline" onClick={handlePrevious}>
                                Previous
                            </Button>
                        )}

                        {/* Spacer div: Used to push the 'Next' button to the right when 'Previous' is hidden */}
                        {currentStep === 1 && <div></div>}

                        {/* Next Button: Visible on steps < TOTAL_STEPS */}
                        {currentStep < TOTAL_STEPS && (
                            <Button type="button" onClick={handleNext}>
                                Next
                            </Button>
                        )}

                        {/* Submit Button: Visible only on the last step */}
                        {currentStep === TOTAL_STEPS && (
                            <Button type="submit" disabled={isSubmitting}>
                                {/* Show loading spinner and text when submitting */}
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                                {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default OnboardingDialog;
