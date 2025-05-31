// src/components/onboarding/OnboardingDialog.tsx - Functional Multi-Step Form

import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller, useFormState } from 'react-hook-form';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

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

    // NEW FIELDS ADDED
    financial_year_start_month: number;
    nssf_employer_id: string;
    shif_employer_id: string;
    helb_employer_id?: string; // Optional
    housing_levy_employer_id?: string; // Optional
    payroll_cut_off_day_of_month: number;
    payroll_pay_day_of_month: number;
}

interface OnboardingDialogProps {
    onOnboardingComplete: () => void; // Callback function for successful onboarding
    isOpen: boolean; // Controls dialog visibility
    onClose: () => void; // Function to close the dialog
}

const TOTAL_STEPS = 4; // UPDATED: Define the total number of steps in the form

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ onOnboardingComplete, isOpen, onClose }) => {
    const { accessToken } = useAuthStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const methods = useForm<OnboardingFormData>({
        mode: 'onTouched',
        defaultValues: {
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
            default_work_days: 5,
            default_work_hours: 8,
            nssf_scheme: '',
            shif_rate_option: '',
            // NEW DEFAULT VALUES
            financial_year_start_month: 1, // Default to January
            nssf_employer_id: '',
            shif_employer_id: '',
            helb_employer_id: '', // Empty string for optional text fields
            housing_levy_employer_id: '', // Empty string for optional text fields
            payroll_cut_off_day_of_month: 25, // Default to 25th
            payroll_pay_day_of_month: 30, // Default to 30th
        }
    });

    const {
        register,
        handleSubmit,
        trigger,
        control,
    } = methods;

    const { errors } = useFormState({ control });

    const handleNext = async () => {
        setFormError(null);

        let fieldsToValidate: (keyof OnboardingFormData)[] = [];
        if (currentStep === 1) {
            fieldsToValidate = ['business_name', 'business_type', 'industry', 'kra_pin', 'reg_number'];
        } else if (currentStep === 2) {
            fieldsToValidate = ['company_email', 'company_phone', 'address', 'county'];
        } else if (currentStep === 3) { // Old Step 3 + new payroll cycle fields
            fieldsToValidate = [
                'payroll_frequency', 'default_work_days', 'default_work_hours',
                'nssf_scheme', 'shif_rate_option',
                'payroll_cut_off_day_of_month', 'payroll_pay_day_of_month' // Added new fields
            ];
        } else if (currentStep === 4) { // New Step 4
            fieldsToValidate = [
                'financial_year_start_month',
                'nssf_employer_id',
                'shif_employer_id',
                // HELB and Housing Levy are optional, so not included in required validation here
            ];
        }

        const isStepValid = await trigger(fieldsToValidate, { shouldFocus: true });

        if (isStepValid) {
            setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
        } else {
            setFormError("Please fix the errors in this step before proceeding.");
        }
    };

    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
        setFormError(null);
    };

    const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
        setIsSubmitting(true);
        setFormError(null);

        if (!accessToken) {
            setFormError("Authentication token is missing. Please log in again.");
            toast.error("Authentication token missing.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/company`, data, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            console.log("Onboarding data saved:", response.data);

            toast.success("Company details saved successfully!");
            onOnboardingComplete();
            onClose();

        } catch (err: unknown) {
            console.error("Error saving company details:", err);

            if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
                interface ErrorResponse {
                    error?: string;
                    message?: string;
                }
                const backendErrorMessage = (err.response.data as ErrorResponse)?.error || (err.response.data as ErrorResponse)?.message || "Failed to save company details.";
                setFormError(backendErrorMessage);
                toast.error(backendErrorMessage);
            } else {
                const genericErrorMessage = "An unexpected error occurred while saving details.";
                setFormError(genericErrorMessage);
                toast.error(genericErrorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper function to render the progress indicator dots
    const renderProgressIndicator = () => (
        <div className="flex flex-col items-center mb-6">
            <div className="text-sm font-medium text-gray-600 mb-2">
                Step {currentStep} of {TOTAL_STEPS}
            </div>
            <div className="flex justify-center space-x-2">
                {[...Array(TOTAL_STEPS)].map((_, index) => (
                    <div
                        key={index}
                        className={`h-2 w-8 rounded-full transition-all duration-300 ease-in-out ${
                            index + 1 <= currentStep ? 'bg-[#7F5EFD]' : 'bg-gray-300'
                        }`}
                    ></div>
                ))}
            </div>
        </div>
    );

    // Helper function to render the content (form fields) for the current step
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4 text-[#7F5EFD]">Business Information</h3>
                        <div>
                            <Label className='mb-2' htmlFor="business_name">Business Name</Label>
                            <Input id="business_name" {...register("business_name", { required: "Business Name is required" })} />
                            {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="business_type">Business Type</Label>
                            <Controller
                                name="business_type"
                                control={control}
                                rules={{ required: "Business Type is required" }}
                                render={({ field }) => (
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
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="kra_pin">KRA PIN</Label>
                            <Input id="kra_pin" {...register("kra_pin", { required: "KRA PIN is required" })} />
                            {errors.kra_pin && <p className="text-red-500 text-sm mt-1">{errors.kra_pin.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="reg_number">Registration Number</Label>
                            <Input id="reg_number" {...register("reg_number", { required: "Registration Number is required" })} />
                            {errors.reg_number && <p className="text-red-500 text-sm mt-1">{errors.reg_number.message}</p>}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4 text-[#7F5EFD]">Contact & Location</h3>
                        <div>
                            <Label className='mb-2' htmlFor="company_email">Company Email</Label>
                            <Input
                                id="company_email"
                                type="email"
                                {...register("company_email", {
                                    required: "Company Email is required",
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: "Invalid email format"
                                    }
                                })}
                            />
                            {errors.company_email && <p className="text-red-500 text-sm mt-1">{errors.company_email.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="company_phone">Company Phone</Label>
                            <Input id="company_phone" type="tel" {...register("company_phone", { required: "Company Phone is required" })} />
                            {errors.company_phone && <p className="text-red-500 text-sm mt-1">{errors.company_phone.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="address">Address</Label>
                            <Textarea id="address" {...register("address", { required: "Address is required" })} />
                            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="county">County</Label>
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
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county.message}</p>}
                        </div>
                    </div>
                );
            case 3: // Existing Payroll Settings + new payroll cycle fields
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4 text-[#7F5EFD]">Payroll Settings</h3>
                        <div>
                            <Label className='mb-2' htmlFor="payroll_frequency">Payroll Frequency</Label>
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
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.payroll_frequency && <p className="text-red-500 text-sm mt-1">{errors.payroll_frequency.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="default_work_days">Default Work Days per Week</Label>
                            <Input
                                id="default_work_days"
                                type="number"
                                {...register("default_work_days", {
                                    required: "Default Work Days is required",
                                    min: { value: 1, message: "Must be at least 1" },
                                    max: { value: 7, message: "Cannot exceed 7" },
                                    valueAsNumber: true,
                                })}
                            />
                            {errors.default_work_days && <p className="text-red-500 text-sm mt-1">{errors.default_work_days.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="default_work_hours">Default Work Hours per Day</Label>
                            <Input
                                id="default_work_hours"
                                type="number"
                                {...register("default_work_hours", {
                                    required: "Default Work Hours is required",
                                    min: { value: 1, message: "Must be at least 1" },
                                    max: { value: 24, message: "Cannot exceed 24" },
                                    valueAsNumber: true,
                                })}
                            />
                            {errors.default_work_hours && <p className="text-red-500 text-sm mt-1">{errors.default_work_hours.message}</p>}
                        </div>
                        {/* NEW FIELDS FOR PAYROLL SETTINGS */}
                        <div>
                            <Label className='mb-2' htmlFor="payroll_cut_off_day_of_month">Payroll Cut-off Day of Month</Label>
                            <Input
                                id="payroll_cut_off_day_of_month"
                                type="number"
                                {...register("payroll_cut_off_day_of_month", {
                                    required: "Payroll Cut-off Day is required",
                                    min: { value: 1, message: "Must be at least 1" },
                                    max: { value: 31, message: "Cannot exceed 31" },
                                    valueAsNumber: true,
                                })}
                            />
                            {errors.payroll_cut_off_day_of_month && <p className="text-red-500 text-sm mt-1">{errors.payroll_cut_off_day_of_month.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="payroll_pay_day_of_month">Payroll Pay Day of Month</Label>
                            <Input
                                id="payroll_pay_day_of_month"
                                type="number"
                                {...register("payroll_pay_day_of_month", {
                                    required: "Payroll Pay Day is required",
                                    min: { value: 1, message: "Must be at least 1" },
                                    max: { value: 31, message: "Cannot exceed 31" },
                                    valueAsNumber: true,
                                })}
                            />
                            {errors.payroll_pay_day_of_month && <p className="text-red-500 text-sm mt-1">{errors.payroll_pay_day_of_month.message}</p>}
                        </div>
                        {/* END NEW FIELDS */}
                        <div>
                            <Label className='mb-2' htmlFor="nssf_scheme">NSSF Scheme</Label>
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
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.nssf_scheme && <p className="text-red-500 text-sm mt-1">{errors.nssf_scheme.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="shif_rate_option">SHIF Rate Option</Label>
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
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.shif_rate_option && <p className="text-red-500 text-sm mt-1">{errors.shif_rate_option.message}</p>}
                        </div>
                    </div>
                );
            case 4: // NEW STEP: Statutory IDs & Financial Year
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4 text-[#7F5EFD]">Statutory & Financial Year Details</h3>
                        <div>
                            <Label className='mb-2' htmlFor="financial_year_start_month">Financial Year Start Month</Label>
                            <Controller
                                name="financial_year_start_month"
                                control={control}
                                rules={{
                                    required: "Financial Year Start Month is required",
                                    min: { value: 1, message: "Month must be between 1 and 12" },
                                    max: { value: 12, message: "Month must be between 1 and 12" }
                                }}
                                render={({ field }) => (
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select start month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[...Array(12)].map((_, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })} ({i + 1})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.financial_year_start_month && <p className="text-red-500 text-sm mt-1">{errors.financial_year_start_month.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="nssf_employer_id">NSSF Employer ID</Label>
                            <Input id="nssf_employer_id" {...register("nssf_employer_id", { required: "NSSF Employer ID is required" })} />
                            {errors.nssf_employer_id && <p className="text-red-500 text-sm mt-1">{errors.nssf_employer_id.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="shif_employer_id">SHIF Employer ID</Label>
                            <Input id="shif_employer_id" {...register("shif_employer_id", { required: "SHIF Employer ID is required" })} />
                            {errors.shif_employer_id && <p className="text-red-500 text-sm mt-1">{errors.shif_employer_id.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="helb_employer_id">HELB Employer ID (Optional)</Label>
                            <Input id="helb_employer_id" {...register("helb_employer_id")} />
                            {errors.helb_employer_id && <p className="text-red-500 text-sm mt-1">{errors.helb_employer_id.message}</p>}
                        </div>
                        <div>
                            <Label className='mb-2' htmlFor="housing_levy_employer_id">Housing Levy Employer ID (Optional)</Label>
                            <Input id="housing_levy_employer_id" {...register("housing_levy_employer_id")} />
                            {errors.housing_levy_employer_id && <p className="text-red-500 text-sm mt-1">{errors.housing_levy_employer_id.message}</p>}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#7F5EFD]">Complete Your Company Profile</DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Please provide your company details to set up your payroll.
                    </DialogDescription>
                </DialogHeader>

                {renderProgressIndicator()}

                {formError && <p className="text-red-500 text-sm mb-4 text-center">{formError}</p>}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {renderStepContent()}

                    <div className="flex justify-between mt-6">
                        {currentStep > 1 && (
                            <Button type="button" variant="outline" onClick={handlePrevious} className="bg-white text-[#7F5EFD] border border-[#7F5EFD] hover:bg-gray-100">
                                Previous
                            </Button>
                        )}

                        {currentStep === 1 && <div></div>}

                        {currentStep < TOTAL_STEPS && (
                            <Button type="button" onClick={handleNext} className="bg-[#7F5EFD] hover:bg-[#6A4BE8] text-white">
                                Next
                            </Button>
                        )}

                        {currentStep === TOTAL_STEPS && (
                            <Button type="submit" disabled={isSubmitting} className="bg-[#7F5EFD] hover:bg-[#6A4BE8] text-white">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                                {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
            {/* Custom Scrollbar Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `}</style>
        </Dialog>
    );
};

export default OnboardingDialog;
