// src/components/dashboard/employee/EmployeeForm.tsx - Employee Data Form (Console Log Only)

//import React from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';

// Import Shadcn UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming this correctly forwards refs
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Assuming this correctly forwards refs
import { Checkbox } from '@/components/ui/checkbox'; // For boolean fields
import { Separator } from '@/components/ui/separator'; // For visual separation

// Define the form data structure based on your 'employees' table schema
// Note: We'll use string for dates and text for numbers initially, except for basic_salary
// We'll refine types and validation later.
interface EmployeeFormData {
    employee_number: string;
    first_name: string;
    last_name: string;
    other_names?: string; // Optional
    email?: string; // Optional
    phone: string;
    id_type: string; // e.g., "National ID", "Passport"
    id_number: string;
    kra_pin: string;
    shif_number?: string; // Optional
    nssf_number?: string; // Optional
    date_of_birth: string; // Use string for date input value
    gender: string; // e.g., 'Male', 'Female', 'Other'
    marital_status?: string; // Optional
    citizenship?: string; // Optional, defaults to 'Kenyan'
    has_disability?: boolean; // Optional, defaults to false

    date_joined: string; // Use string for date input value
    job_title?: string; // Optional
    department?: string; // Optional
    job_type: string; // e.g., "Permanent", "Contract"
    employee_status: string; // e.g., "Active", "Terminated"
    employee_status_effective_date?: string; // Optional, use string for date input value
    end_of_probation_date?: string; // Optional, use string for date input value
    contract_start_date?: string; // Optional, use string for date input value
    contract_end_date?: string; // Optional, use string for date input value
    termination_date?: string; // Optional, use string for date input value
    termination_reason?: string; // Optional

    basic_salary: number; // Use number for salary
    salary_effective_date?: string; // Optional, use string for date input value
    payment_method: string; // e.g., "Bank Transfer", "M-Pesa"
    bank_name?: string; // Optional
    bank_branch?: string; // Optional
    bank_code?: string; // Optional
    bank_account_number?: string; // Optional
    mpesa_phone_number?: string; // Optional

    is_helb_paying?: boolean; // Optional, defaults to false
    benefits?: boolean; // Optional, defaults to false
    extra_deductions?: boolean; // Optional, defaults to false
    paye_tax_exemption?: boolean; // Optional, defaults to false
    disability_tax_exemption?: boolean; // Optional, defaults to false

    physical_address?: string; // Optional
    postal_address?: string; // Optional
    county?: string; // Optional
    postal_code?: string; // Optional

    next_of_kin_name?: string; // Optional
    next_of_kin_relationship?: string; // Optional
    next_of_kin_phone?: string; // Optional
}

const EmployeeForm = () => {
    // Initialize react-hook-form
    const methods = useForm<EmployeeFormData>({
        defaultValues: {
            // Set default values based on schema defaults or common values
            employee_number: '',
            first_name: '',
            last_name: '',
            other_names: '',
            email: '',
            phone: '',
            id_type: '', // No default, requires selection
            id_number: '',
            kra_pin: '',
            shif_number: '',
            nssf_number: '',
            date_of_birth: '',
            gender: '', // No default, requires selection
            marital_status: '',
            citizenship: 'Kenyan', // Default value
            has_disability: false, // Default value

            date_joined: '',
            job_title: '',
            department: '',
            job_type: '', // No default, requires selection
            employee_status: '', // No default, requires selection
            employee_status_effective_date: '',
            end_of_probation_date: '',
            contract_start_date: '',
            contract_end_date: '',
            termination_date: '',
            termination_reason: '',

            basic_salary: 0, // Default number value
            salary_effective_date: '',
            payment_method: '', // No default, requires selection
            bank_name: '',
            bank_branch: '',
            bank_code: '',
            bank_account_number: '',
            mpesa_phone_number: '',

            is_helb_paying: false, // Default value
            benefits: false, // Default value
            extra_deductions: false, // Default value
            paye_tax_exemption: false, // Default value
            disability_tax_exemption: false, // Default value

            physical_address: '',
            postal_address: '',
            county: '', // No default, requires selection if used
            postal_code: '',

            next_of_kin_name: '',
            next_of_kin_relationship: '',
            next_of_kin_phone: '',
        }
    });

    // Destructure necessary functions from the useForm methods
    const {
        register, // Function to register input fields
        handleSubmit, // Function to handle form submission
        control, // Object needed for the Controller component
        // We don't need trigger, useFormState, getValues, setValue, reset for this simple version
    } = methods;

    // Function to handle form submission - currently just logs data
    const onSubmit: SubmitHandler<EmployeeFormData> = (data) => {
        console.log("Employee form data captured:", data);
        // In the next step, we will add API submission logic here
    };

    return (
        // Form container with padding and max width
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">Add New Employee</h2>

            {/* Use handleSubmit for the form's onSubmit event */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Personal Information Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="employee_number">Employee Number</Label>
                            <Input id="employee_number" {...register("employee_number")} />
                        </div>
                        <div>
                            <Label htmlFor="first_name">First Name</Label>
                            <Input id="first_name" {...register("first_name")} />
                        </div>
                        <div>
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input id="last_name" {...register("last_name")} />
                        </div>
                        <div>
                            <Label htmlFor="other_names">Other Names (Middle Names)</Label>
                            <Input id="other_names" {...register("other_names")} />
                        </div>
                        <div>
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input id="email" type="email" {...register("email")} />
                        </div>
                        <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" type="tel" {...register("phone")} />
                        </div>
                        <div>
                            <Label htmlFor="id_type">ID Type</Label>
                            <Controller
                                name="id_type"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select ID type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="National ID">National ID</SelectItem>
                                            <SelectItem value="Passport">Passport</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div>
                            <Label htmlFor="id_number">ID Number</Label>
                            <Input id="id_number" {...register("id_number")} />
                        </div>
                        <div>
                            <Label htmlFor="kra_pin">KRA PIN</Label>
                            <Input id="kra_pin" {...register("kra_pin")} />
                        </div>
                        <div>
                            <Label htmlFor="shif_number">SHIF Number (Optional)</Label>
                            <Input id="shif_number" {...register("shif_number")} />
                        </div>
                        <div>
                            <Label htmlFor="nssf_number">NSSF Number (Optional)</Label>
                            <Input id="nssf_number" {...register("nssf_number")} />
                        </div>
                        <div>
                            <Label htmlFor="date_of_birth">Date of Birth</Label>
                            {/* Use type="date" for browser's date picker */}
                            <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
                        </div>
                        <div>
                            <Label htmlFor="gender">Gender</Label>
                            <Controller
                                name="gender"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                         <div>
                            <Label htmlFor="marital_status">Marital Status (Optional)</Label>
                            <Controller
                                name="marital_status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Single">Single</SelectItem>
                                            <SelectItem value="Married">Married</SelectItem>
                                            <SelectItem value="Divorced">Divorced</SelectItem>
                                            <SelectItem value="Widowed">Widowed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div>
                            <Label htmlFor="citizenship">Citizenship (Optional)</Label>
                             <Input id="citizenship" {...register("citizenship")} />
                        </div>
                         <div className="flex items-center space-x-2 mt-6"> {/* Align checkbox */}
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
                        </div>
                    </div>
                </div>

                <Separator /> {/* Visual separator */}

                {/* Employment Details Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Employment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date_joined">Date Joined</Label>
                            <Input id="date_joined" type="date" {...register("date_joined")} />
                        </div>
                        <div>
                            <Label htmlFor="job_title">Job Title (Optional)</Label>
                            <Input id="job_title" {...register("job_title")} />
                        </div>
                        <div>
                            <Label htmlFor="department">Department (Optional)</Label>
                            <Input id="department" {...register("department")} />
                        </div>
                        <div>
                            <Label htmlFor="job_type">Job Type</Label>
                            <Controller
                                name="job_type"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select job type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Permanent">Permanent</SelectItem>
                                            <SelectItem value="Contract">Contract</SelectItem>
                                            <SelectItem value="Part-time">Part-time</SelectItem>
                                            <SelectItem value="Internship">Internship</SelectItem>
                                            <SelectItem value="Casual">Casual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div>
                            <Label htmlFor="employee_status">Employee Status</Label>
                            <Controller
                                name="employee_status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="On Leave">On Leave</SelectItem>
                                            <SelectItem value="Terminated">Terminated</SelectItem>
                                            <SelectItem value="Probation">Probation</SelectItem>
                                            <SelectItem value="Confirmed">Confirmed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div>
                            <Label htmlFor="employee_status_effective_date">Status Effective Date (Optional)</Label>
                            <Input id="employee_status_effective_date" type="date" {...register("employee_status_effective_date")} />
                        </div>
                        {/* Conditional fields based on status/type can be added later */}
                        {/* For now, include all date fields */}
                         <div>
                            <Label htmlFor="end_of_probation_date">End of Probation Date (Optional)</Label>
                            <Input id="end_of_probation_date" type="date" {...register("end_of_probation_date")} />
                        </div>
                         <div>
                            <Label htmlFor="contract_start_date">Contract Start Date (Optional)</Label>
                            <Input id="contract_start_date" type="date" {...register("contract_start_date")} />
                        </div>
                         <div>
                            <Label htmlFor="contract_end_date">Contract End Date (Optional)</Label>
                            <Input id="contract_end_date" type="date" {...register("contract_end_date")} />
                        </div>
                         <div>
                            <Label htmlFor="termination_date">Termination Date (Optional)</Label>
                            <Input id="termination_date" type="date" {...register("termination_date")} />
                        </div>
                         <div className="md:col-span-2"> {/* Make termination reason span two columns */}
                            <Label htmlFor="termination_reason">Termination Reason (Optional)</Label>
                            <Textarea id="termination_reason" {...register("termination_reason")} />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Payroll Details Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Payroll Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="basic_salary">Basic Salary</Label>
                            {/* Use type="number" and valueAsNumber for salary */}
                            <Input id="basic_salary" type="number" step="0.01" {...register("basic_salary", { valueAsNumber: true })} />
                        </div>
                         <div>
                            <Label htmlFor="salary_effective_date">Salary Effective Date (Optional)</Label>
                            <Input id="salary_effective_date" type="date" {...register("salary_effective_date")} />
                        </div>
                         <div>
                            <Label htmlFor="payment_method">Payment Method</Label>
                             <Controller
                                name="payment_method"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                            <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        {/* Bank Details (Optional, maybe conditional based on payment_method) */}
                         <div>
                            <Label htmlFor="bank_name">Bank Name (Optional)</Label>
                            <Input id="bank_name" {...register("bank_name")} />
                        </div>
                         <div>
                            <Label htmlFor="bank_branch">Bank Branch (Optional)</Label>
                            <Input id="bank_branch" {...register("bank_branch")} />
                        </div>
                         <div>
                            <Label htmlFor="bank_code">Bank Code (Optional)</Label>
                            <Input id="bank_code" {...register("bank_code")} />
                        </div>
                         <div>
                            <Label htmlFor="bank_account_number">Bank Account Number (Optional)</Label>
                            <Input id="bank_account_number" {...register("bank_account_number")} />
                        </div>
                         {/* M-Pesa Details (Optional, maybe conditional) */}
                         <div>
                            <Label htmlFor="mpesa_phone_number">M-Pesa Phone Number (Optional)</Label>
                            <Input id="mpesa_phone_number" {...register("mpesa_phone_number")} />
                        </div>

                        {/* Tax/Benefit Flags */}
                         <div className="flex items-center space-x-2 mt-6">
                            <Controller
                                name="is_helb_paying"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="is_helb_paying"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="is_helb_paying">Is HELB Paying?</Label>
                        </div>
                         <div className="flex items-center space-x-2 mt-6">
                            <Controller
                                name="benefits"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="benefits"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="benefits">Receives Benefits?</Label>
                        </div>
                         <div className="flex items-center space-x-2 mt-6">
                            <Controller
                                name="extra_deductions"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="extra_deductions"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="extra_deductions">Has Extra Deductions?</Label>
                        </div>
                         <div className="flex items-center space-x-2 mt-6">
                            <Controller
                                name="paye_tax_exemption"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="paye_tax_exemption"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="paye_tax_exemption">PAYE Tax Exemption?</Label>
                        </div>
                         <div className="flex items-center space-x-2 mt-6">
                            <Controller
                                name="disability_tax_exemption"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="disability_tax_exemption"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="disability_tax_exemption">Disability Tax Exemption?</Label>
                        </div>
                     </div>
                </div>

                <Separator />

                {/* Contact Information Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="physical_address">Physical Address (Optional)</Label>
                            <Input id="physical_address" {...register("physical_address")} />
                        </div>
                         <div>
                            <Label htmlFor="postal_address">Postal Address (Optional)</Label>
                            <Input id="postal_address" {...register("postal_address")} />
                        </div>
                         <div>
                            <Label htmlFor="county">County (Optional)</Label>
                             <Controller
                                name="county"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select county" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kiambu">Kiambu</SelectItem>
                                            <SelectItem value="nairobi">Nairobi</SelectItem>
                                            <SelectItem value="mombasa">Mombasa</SelectItem>
                                            {/* Add more counties */}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                         <div>
                            <Label htmlFor="postal_code">Postal Code (Optional)</Label>
                            <Input id="postal_code" {...register("postal_code")} />
                        </div>
                     </div>
                </div>

                 <Separator />

                {/* Next of Kin Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Next of Kin (Optional)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="next_of_kin_name">Name</Label>
                            <Input id="next_of_kin_name" {...register("next_of_kin_name")} />
                        </div>
                         <div>
                            <Label htmlFor="next_of_kin_relationship">Relationship</Label>
                            <Input id="next_of_kin_relationship" {...register("next_of_kin_relationship")} />
                        </div>
                         <div>
                            <Label htmlFor="next_of_kin_phone">Phone</Label>
                            <Input id="next_of_kin_phone" type="tel" {...register("next_of_kin_phone")} />
                        </div>
                     </div>
                </div>


                {/* Submit Button */}
                <div className="flex justify-end mt-6">
                    <Button type="submit">
                         Log Employee Data
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeForm;
