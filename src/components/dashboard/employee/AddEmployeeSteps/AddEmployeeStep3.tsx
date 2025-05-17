// src/components/dashboard/employee/AddEmployeeStep3.tsx

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form'; // Use useFormContext

// Import Shadcn UI components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';


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
    marital_status?: string;
    citizenship?: string;
    has_disability?: boolean;
    date_joined: Date | undefined;
    job_title?: string;
    department?: string;
    job_type: string;
    employee_status: string;
    employee_status_effective_date?: Date | undefined;
    end_of_probation_date?: Date | undefined;
    contract_start_date?: Date | undefined;
    contract_end_date?: Date | undefined;
    termination_date?: Date | undefined;
    termination_reason?: string;
    basic_salary: number;
    salary_effective_date?: Date | undefined;
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
    is_helb_paying?: boolean; // Optional
    benefits?: boolean; // Optional
    extra_deductions?: boolean; // Optional
    paye_tax_exemption?: boolean; // Optional
    disability_tax_exemption?: boolean; // Optional
    physical_address?: string;
    postal_address?: string;
    county?: string;
    postal_code?: string;
    next_of_kin_name?: string;
    next_of_kin_relationship?: string;
    next_of_kin_phone?: string;
    logo?: string;
}


const AddEmployeeStep3: React.FC = () => {
    // Use useFormContext to access form methods provided by FormProvider
    const { register, control, formState: { errors } } = useFormContext<AddEmployeeFormData>();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/*  */}

             <h3 className="col-span-full text-lg font-semibold mt-4 mb-2">Banking Details (Optional)</h3>
             <div>
                <Label htmlFor="bank_name">Bank Name (Optional)</Label>
                <Input id="bank_name" {...register("bank_name")} />
                 {errors.bank_name && <p className="text-red-500 text-sm mt-1">{errors.bank_name.message}</p>}
            </div>
             <div>
                <Label htmlFor="bank_branch">Bank Branch (Optional)</Label>
                <Input id="bank_branch" {...register("bank_branch")} />
                 {errors.bank_branch && <p className="text-red-500 text-sm mt-1">{errors.bank_branch.message}</p>}
            </div>
             <div>
                <Label htmlFor="bank_code">Bank Code (Optional)</Label>
                <Input id="bank_code" {...register("bank_code")} />
                 {errors.bank_code && <p className="text-red-500 text-sm mt-1">{errors.bank_code.message}</p>}
            </div>
             <div>
                <Label htmlFor="bank_account_number">Bank Account Number (Optional)</Label>
                <Input id="bank_account_number" {...register("bank_account_number")} />
                 {errors.bank_account_number && <p className="text-red-500 text-sm mt-1">{errors.bank_account_number.message}</p>}
            </div>
             <div>
                <Label htmlFor="mpesa_phone_number">M-Pesa Phone Number (Optional)</Label>
                <Input id="mpesa_phone_number" {...register("mpesa_phone_number")} />
                 {errors.mpesa_phone_number && <p className="text-red-500 text-sm mt-1">{errors.mpesa_phone_number.message}</p>}
            </div>

             <h3 className="col-span-full text-lg font-semibold mt-4 mb-2">Tax & Benefits (Optional)</h3>
             <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex items-center space-x-2">
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
                     {errors.is_helb_paying && <p className="text-red-500 text-sm mt-1">{errors.is_helb_paying.message}</p>}
                </div>
                 <div className="flex items-center space-x-2">
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
                     {errors.benefits && <p className="text-red-500 text-sm mt-1">{errors.benefits.message}</p>}
                </div>
                 <div className="flex items-center space-x-2">
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
                     {errors.extra_deductions && <p className="text-red-500 text-sm mt-1">{errors.extra_deductions.message}</p>}
                </div>
                 <div className="flex items-center space-x-2">
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
                     {errors.paye_tax_exemption && <p className="text-red-500 text-sm mt-1">{errors.paye_tax_exemption.message}</p>}
                </div>
                 <div className="flex items-center space-x-2">
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
                     {errors.disability_tax_exemption && <p className="text-red-500 text-sm mt-1">{errors.disability_tax_exemption.message}</p>}
                </div>
             </div>

             <h3 className="col-span-full text-lg font-semibold mt-4 mb-2">Address & Next of Kin (Optional)</h3>
             <div>
                <Label htmlFor="physical_address">Physical Address (Optional)</Label>
                 <Textarea id="physical_address" {...register("physical_address")} />
                 {errors.physical_address && <p className="text-red-500 text-sm mt-1">{errors.physical_address.message}</p>}
            </div>
             <div>
                <Label htmlFor="postal_address">Postal Address (Optional)</Label>
                 <Textarea id="postal_address" {...register("postal_address")} />
                 {errors.postal_address && <p className="text-red-500 text-sm mt-1">{errors.postal_address.message}</p>}
            </div>
             <div>
                <Label htmlFor="county">County (Optional)</Label>
                 <Controller
                    name="county"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
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
                 {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county.message}</p>}
            </div>
             <div>
                <Label htmlFor="postal_code">Postal Code (Optional)</Label>
                 <Input id="postal_code" {...register("postal_code")} />
                 {errors.postal_code && <p className="text-red-500 text-sm mt-1">{errors.postal_code.message}</p>}
            </div>

             <h3 className="col-span-full text-lg font-semibold mt-4 mb-2">Next of Kin (Optional)</h3>
             <div>
                <Label htmlFor="next_of_kin_name">Next of Kin Name (Optional)</Label>
                 <Input id="next_of_kin_name" {...register("next_of_kin_name")} />
                 {errors.next_of_kin_name && <p className="text-red-500 text-sm mt-1">{errors.next_of_kin_name.message}</p>}
            </div>
             <div>
                <Label htmlFor="next_of_kin_relationship">Next of Kin Relationship (Optional)</Label>
                 <Input id="next_of_kin_relationship" {...register("next_of_kin_relationship")} />
                 {errors.next_of_kin_relationship && <p className="text-red-500 text-sm mt-1">{errors.next_of_kin_relationship.message}</p>}
            </div>
             <div>
                <Label htmlFor="next_of_kin_phone">Next of Kin Phone (Optional)</Label>
                 <Input id="next_of_kin_phone" {...register("next_of_kin_phone")} />
                 {errors.next_of_kin_phone && <p className="text-red-500 text-sm mt-1">{errors.next_of_kin_phone.message}</p>}
            </div>
             {/* Add logo field if needed */}
             {/* <div>
                <Label htmlFor="logo">Employee Photo URL (Optional)</Label>
                <Input id="logo" {...register("logo")} />
             </div> */}
        </div>
    );
};

export default AddEmployeeStep3;
