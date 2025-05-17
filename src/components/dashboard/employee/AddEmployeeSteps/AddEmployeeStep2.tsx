// src/components/dashboard/employee/AddEmployeeStep2.tsx

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form'; // Use useFormContext
import { DateTime } from 'luxon'; // Import Luxon
import { CalendarIcon } from 'lucide-react'; // Import icon

// Import Shadcn UI components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils'; // Assuming you have a utility for className merging


// Define the form data structure (needs to match the main form)
interface AddEmployeeFormData {
    // Include all fields from the main form interface
    employee_number: string;
    first_name: string;
    last_name: string;
    other_names?: string;
    email?: string;
    phone: string;
    id_type: string;
    id_number: string;
    kra_pin: string;
    shif_number?: string;
    nssf_number?: string;
    date_of_birth: Date | undefined;
    gender: string;
    marital_status?: string; // Optional
    citizenship?: string; // Optional
    has_disability?: boolean; // Optional
    date_joined: Date | undefined;
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
    basic_salary: number;
    salary_effective_date?: Date | undefined; // Optional
    payment_method: string;
    bank_name?: string; // Optional
    bank_branch?: string; // Optional
    bank_code?: string; // Optional
    bank_account_number?: string; // Optional
    mpesa_phone_number?: string; // Optional
    is_helb_paying?: boolean; // Optional
    benefits?: boolean; // Optional
    extra_deductions?: boolean; // Optional
    paye_tax_exemption?: boolean; // Optional
    disability_tax_exemption?: boolean; // Optional
    physical_address?: string; // Optional
    postal_address?: string; // Optional
    county?: string; // Optional
    postal_code?: string; // Optional
    next_of_kin_name?: string; // Optional
    next_of_kin_relationship?: string; // Optional
    next_of_kin_phone?: string; // Optional
    //logo?: string; // Optional
}


const AddEmployeeStep2: React.FC = () => {
    // Use useFormContext to access form methods provided by FormProvider
    const { register, control, formState: { errors } } = useFormContext<AddEmployeeFormData>();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full text-lg font-semibold mb-2">Additional Details</h3>
            <div>
                <Label htmlFor="marital_status">Marital Status (Optional)</Label>
                 <Controller
                    name="marital_status"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="divorced">Divorced</SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.marital_status && <p className="text-red-500 text-sm mt-1">{errors.marital_status.message}</p>}
            </div>
             <div>
                <Label htmlFor="citizenship">Citizenship (Optional)</Label>
                 <Input id="citizenship" {...register("citizenship")} placeholder="e.g., Kenyan" />
                 {errors.citizenship && <p className="text-red-500 text-sm mt-1">{errors.citizenship.message}</p>}
            </div>
             <div className="col-span-full flex items-center space-x-2">
                <Controller
                    name="has_disability"
                    control={control}
                    render={({ field }) => (
                        <Checkbox
                            id="has_disability"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
                <Label htmlFor="has_disability">Has Disability?</Label>
                 {errors.has_disability && <p className="text-red-500 text-sm mt-1">{errors.has_disability.message}</p>}
            </div>

             <h3 className="col-span-full text-lg font-semibold mt-4 mb-2">Job Information</h3>
             <div>
                <Label htmlFor="job_title">Job Title (Optional)</Label>
                <Input id="job_title" {...register("job_title")} />
                 {errors.job_title && <p className="text-red-500 text-sm mt-1">{errors.job_title.message}</p>}
            </div>
             <div>
                <Label htmlFor="department">Department (Optional)</Label>
                 <Input id="department" {...register("department")} />
                 {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department.message}</p>}
            </div>
             <div>
                <Label htmlFor="employee_status_effective_date">Status Effective Date (Optional)</Label>
                 <Controller
                    name="employee_status_effective_date"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                     {/* Use Luxon for display formatting */}
                                    {field.value ? DateTime.fromJSDate(field.value).toFormat('MMM dd, yyyy') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {errors.employee_status_effective_date && <p className="text-red-500 text-sm mt-1">{errors.employee_status_effective_date.message}</p>}
            </div>
             <div>
                <Label htmlFor="end_of_probation_date">End of Probation Date (Optional)</Label>
                 <Controller
                    name="end_of_probation_date"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                     {/* Use Luxon for display formatting */}
                                    {field.value ? DateTime.fromJSDate(field.value).toFormat('MMM dd, yyyy') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.end_of_probation_date && <p className="text-red-500 text-sm mt-1">{errors.end_of_probation_date.message}</p>}
            </div>
             <div>
                <Label htmlFor="contract_start_date">Contract Start Date (Optional)</Label>
                 <Controller
                    name="contract_start_date"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                     {/* Use Luxon for display formatting */}
                                    {field.value ? DateTime.fromJSDate(field.value).toFormat('MMM dd, yyyy') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.contract_start_date && <p className="text-red-500 text-sm mt-1">{errors.contract_start_date.message}</p>}
            </div>
             <div>
                <Label htmlFor="contract_end_date">Contract End Date (Optional)</Label>
                 <Controller
                    name="contract_end_date"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                     {/* Use Luxon for display formatting */}
                                    {field.value ? DateTime.fromJSDate(field.value).toFormat('MMM dd, yyyy') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.contract_end_date && <p className="text-red-500 text-sm mt-1">{errors.contract_end_date.message}</p>}
            </div>
             <div>
                <Label htmlFor="termination_date">Termination Date (Optional)</Label>
                 <Controller
                    name="termination_date"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                     {/* Use Luxon for display formatting */}
                                    {field.value ? DateTime.fromJSDate(field.value).toFormat('MMM dd, yyyy') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.termination_date && <p className="text-red-500 text-sm mt-1">{errors.termination_date.message}</p>}
            </div>
             <div>
                <Label htmlFor="termination_reason">Termination Reason (Optional)</Label>
                 <Textarea id="termination_reason" {...register("termination_reason")} />
                 {errors.termination_reason && <p className="text-red-500 text-sm mt-1">{errors.termination_reason.message}</p>}
            </div>
             <div>
                <Label htmlFor="salary_effective_date">Salary Effective Date (Optional)</Label>
                 <Controller
                    name="salary_effective_date"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                     {/* Use Luxon for display formatting */}
                                    {field.value ? DateTime.fromJSDate(field.value).toFormat('MMM dd, yyyy') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.salary_effective_date && <p className="text-red-500 text-sm mt-1">{errors.salary_effective_date.message}</p>}
            </div>
        </div>
    );
};

export default AddEmployeeStep2;
