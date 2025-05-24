// src/components/dashboard/payroll/RunPayrollDialog.tsx

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Import Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

interface RunPayrollDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onPayrollRunSuccess: () => void; // Callback after successful payroll run
}

interface RunPayrollFormInputs {
    payrollMonth: string;
    payrollYear: string;
}

const RunPayrollDialog: React.FC<RunPayrollDialogProps> = ({ isOpen, onClose, onPayrollRunSuccess }) => {
    const { accessToken } = useAuthStore();
    const { handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<RunPayrollFormInputs>();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Get current month and year to set as default
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear().toString();

    // Months array for dropdown
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Years array (e.g., current year +/- 5 years)
    const years = Array.from({ length: 11 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

    // Set default values on dialog open
    useEffect(() => {
        if (isOpen) {
            reset({
                payrollMonth: currentMonth,
                payrollYear: currentYear
            });
            setFormError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, reset, currentMonth, currentYear]);

    const onSubmit: SubmitHandler<RunPayrollFormInputs> = async (data) => {
        if (!accessToken) {
            toast.error("Authentication token missing. Please log in again.");
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/payroll/run`, data, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            onPayrollRunSuccess(); // Call success callback
            // toast.success is called by the parent component now via onPayrollRunSuccess
             toast.success(response.data.message || "Payroll run initiated successfully!");

        } catch (err: unknown) {
            console.error("Error running payroll:", err);
            if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
                interface ErrorResponse {
                    error?: string;
                    message?: string;
                    details?: unknown;
                }
                const backendError = err.response.data as ErrorResponse;
                const errorMessage = backendError.error || backendError.message || 'Failed to run payroll.';
                setFormError(errorMessage);
                toast.error(errorMessage);
            } else {
                setFormError('An unexpected error occurred during payroll run.');
                toast.error('An unexpected error occurred during payroll run.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Run New Payroll</DialogTitle>
                    <DialogDescription>
                        Select the month and year for which you want to run the payroll.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payrollMonth" className="text-right">
                            Month
                        </Label>
                        <Select
                            onValueChange={(value) => setValue('payrollMonth', value, { shouldValidate: true })}
                            value={watch('payrollMonth')}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((month) => (
                                    <SelectItem key={month} value={month}>{month}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.payrollMonth && <p className="col-span-4 text-red-500 text-sm text-right">{errors.payrollMonth.message}</p>}
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payrollYear" className="text-right">
                            Year
                        </Label>
                        <Select
                            onValueChange={(value) => setValue('payrollYear', value, { shouldValidate: true })}
                            value={watch('payrollYear')}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((year) => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.payrollYear && <p className="col-span-4 text-red-500 text-sm text-right">{errors.payrollYear.message}</p>}
                    </div>

                    {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isSubmitting ? 'Processing...' : 'Run Payroll'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RunPayrollDialog;
