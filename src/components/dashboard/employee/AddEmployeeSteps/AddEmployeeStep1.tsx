// src/components/dashboard/employee/AddEmployeeStep1.tsx

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form'; // Use useFormContext
import { DateTime } from 'luxon'; // Import Luxon
import { CalendarIcon } from 'lucide-react'; // Import icon

// Import Shadcn UI components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils'; // Assuming you have a utility for className merging


// Define the form data structure (needs to match the main form)
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
    date_of_birth: Date | undefined; // Use Date type for date picker
    gender: string;
    date_joined: Date | undefined; // Use Date type for date picker
    job_type: string;
    employee_status: string;
    basic_salary: number; // Use number type
    payment_method: string;
    // Include other fields from the main form interface if needed for context,
    // but only render the ones for this step
    marital_status?: string;
    citizenship?: string;
    has_disability?: boolean;
    job_title?: string;
    department?: string;
    employee_status_effective_date?: Date | undefined;
    end_of_probation_date?: Date | undefined;
    contract_start_date?: Date | undefined;
    contract_end_date?: Date | undefined;
    termination_date?: Date | undefined;
    termination_reason?: string;
    salary_effective_date?: Date | undefined;
    // payroll_frequency?: string;
    // default_work_days?: number;
    // default_work_hours?: number;
    // nssf_scheme?: string;
    // shif_rate_option?: string;
    bank_name?: string;
    bank_branch?: string;
    bank_code?: string;
    bank_account_number?: string;
    mpesa_phone_number?: string;
    is_helb_paying?: boolean;
    benefits?: boolean;
    extra_deductions?: boolean;
    paye_tax_exemption?: boolean;
    disability_tax_exemption?: boolean;
    physical_address?: string;
    postal_address?: string;
    county?: string;
    postal_code?: string;
    next_of_kin_name?: string;
    next_of_kin_relationship?: string;
    next_of_kin_phone?: string;
    //logo?: string;
}


const AddEmployeeStep1: React.FC = () => {
    // Use useFormContext to access form methods provided by FormProvider
    const { register, control, formState: { errors } } = useFormContext<AddEmployeeFormData>();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full text-lg font-semibold mb-2">Basic Information</h3>
            <div>
                <Label htmlFor="employee_number">Employee Number</Label>
                <Input id="employee_number" {...register("employee_number", { required: "Employee Number is required" })} />
                {errors.employee_number && <p className="text-red-500 text-sm mt-1">{errors.employee_number.message}</p>}
            </div>
             <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" {...register("first_name", { required: "First Name is required" })} />
                {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
            </div>
             <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" {...register("last_name", { required: "Last Name is required" })} />
                {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
            </div>
             <div>
                <Label htmlFor="other_names">Other Names (Optional)</Label>
                <Input id="other_names" {...register("other_names")} />
                {errors.other_names && <p className="text-red-500 text-sm mt-1">{errors.other_names.message}</p>}
            </div>
             <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input id="email" type="email" {...register("email", { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email format" } })} />
                 {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
             <div>
                <Label htmlFor="phone">Phone</Label>
                 {/* Consider adding phone number validation regex */}
                <Input id="phone" type="tel" {...register("phone", { required: "Phone is required" })} />
                 {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
             <div>
                <Label htmlFor="id_type">ID Type</Label>
                 <Controller
                    name="id_type"
                    control={control}
                    rules={{ required: "ID Type is required" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="national_id">National ID</SelectItem>
                                <SelectItem value="passport">Passport</SelectItem>
                                {/* Add more options as needed */}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.id_type && <p className="text-red-500 text-sm mt-1">{errors.id_type.message}</p>}
            </div>
             <div>
                <Label htmlFor="id_number">ID Number</Label>
                <Input id="id_number" {...register("id_number", { required: "ID Number is required" })} />
                 {errors.id_number && <p className="text-red-500 text-sm mt-1">{errors.id_number.message}</p>}
            </div>
             <div>
                <Label htmlFor="kra_pin">KRA PIN</Label>
                <Input id="kra_pin" {...register("kra_pin", { required: "KRA PIN is required" })} />
                 {errors.kra_pin && <p className="text-red-500 text-sm mt-1">{errors.kra_pin.message}</p>}
            </div>
             <div>
                <Label htmlFor="shif_number">SHIF Number (Optional)</Label>
                <Input id="shif_number" {...register("shif_number")} />
                 {errors.shif_number && <p className="text-red-500 text-sm mt-1">{errors.shif_number.message}</p>}
            </div>
             <div>
                <Label htmlFor="nssf_number">NSSF Number (Optional)</Label>
                <Input id="nssf_number" {...register("nssf_number")} />
                 {errors.nssf_number && <p className="text-red-500 text-sm mt-1">{errors.nssf_number.message}</p>}
            </div>
             <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                 <Controller
                    name="date_of_birth"
                    control={control}
                    rules={{ required: "Date of Birth is required" }}
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
                {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>}
            </div>
             <div>
                <Label htmlFor="gender">Gender</Label>
                 <Controller
                    name="gender"
                    control={control}
                    rules={{ required: "Gender is required" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
            </div>
             <div>
                <Label htmlFor="date_joined">Date Joined</Label>
                 <Controller
                    name="date_joined"
                    control={control}
                    rules={{ required: "Date Joined is required" }}
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
                 {errors.date_joined && <p className="text-red-500 text-sm mt-1">{errors.date_joined.message}</p>}
            </div>
             <div>
                <Label htmlFor="job_type">Job Type</Label>
                 <Controller
                    name="job_type"
                    control={control}
                    rules={{ required: "Job Type is required" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full-time">Full-time</SelectItem>
                                <SelectItem value="part-time">Part-time</SelectItem>
                                <SelectItem value="contract">Contract</SelectItem>
                                {/* Add more options */}
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.job_type && <p className="text-red-500 text-sm mt-1">{errors.job_type.message}</p>}
            </div>
             <div>
                <Label htmlFor="employee_status">Employee Status</Label>
                 <Controller
                    name="employee_status"
                    control={control}
                    rules={{ required: "Employee Status is required" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="on_leave">On Leave</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                                {/* Add more options */}
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.employee_status && <p className="text-red-500 text-sm mt-1">{errors.employee_status.message}</p>}
            </div>
             <div>
                <Label htmlFor="basic_salary">Basic Salary</Label>
                <Input id="basic_salary" type="number" {...register("basic_salary", { required: "Basic Salary is required", valueAsNumber: true, min: { value: 0, message: "Salary cannot be negative" } })} />
                 {errors.basic_salary && <p className="text-red-500 text-sm mt-1">{errors.basic_salary.message}</p>}
            </div>
             <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                 <Controller
                    name="payment_method"
                    control={control}
                    rules={{ required: "Payment Method is required" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="mpesa">M-Pesa</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                {/* Add more options */}
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.payment_method && <p className="text-red-500 text-sm mt-1">{errors.payment_method.message}</p>}
            </div>
        </div>
    );
};

export default AddEmployeeStep1;
