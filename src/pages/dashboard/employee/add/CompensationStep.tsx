import { useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import axios from 'axios';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Schema for dynamic items
const itemSchema = z.object({
  type: z.string().min(1, 'Type is required.'),
  calculation_type: z.enum(['Amount', 'Percentage']),
  value: z.coerce.number().min(0, 'Value must be a positive number.'),
});

// Main form schema for this step
const formSchema = z.object({
  basic_salary: z.coerce.number().min(1, 'Basic salary is required.'),
  payment_method: z.enum(['Bank Transfer', 'Cash', 'Cheque', 'M-Pesa'], { required_error: 'Payment method is required.' }),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  bank_account_number: z.string().optional(),
  mpesa_phone_number: z.string().optional(),
  kra_pin: z.string().regex(/^[A-Z][0-9]{9}[A-Z]$/, 'Invalid KRA PIN format'),
  nssf_number: z.string().optional(),
  shif_number: z.string().optional(),
  paye_tax_exemption: z.boolean().default(false).optional(),
  paye_exemption_certificate_number: z.string().optional(),
  is_helb_paying: z.boolean().default(false).optional(),
  helb_account_number: z.string().optional(),
  helb_monthly_deduction_amount: z.coerce.number().optional(),
  allowances_json: z.array(itemSchema).optional(),
  non_cash_benefits_json: z.array(itemSchema).optional(),
  other_deductions_json: z.array(itemSchema).optional(),
}).refine(data => data.paye_tax_exemption ? !!data.paye_exemption_certificate_number : true, {
    message: "Certificate number is required for PAYE exemption.",
    path: ["paye_exemption_certificate_number"],
}).refine(data => data.is_helb_paying ? !!data.helb_account_number : true, {
    message: "HELB account number is required.",
    path: ["helb_account_number"],
});

type CompensationFormValues = z.infer<typeof formSchema>;

export interface StepFormRef {
  trigger: () => Promise<boolean>;
  getValues: () => CompensationFormValues;
}

interface CompensationStepProps {
  defaultValues: Partial<CompensationFormValues>;
}

interface Bank {
    name: string;
    code: string;
    branches: { name: string; code: string }[];
}

const CompensationStep = forwardRef<StepFormRef, CompensationStepProps>(({ defaultValues }, ref) => {
  const { accessToken } = useAuthStore();
  const [banks, setBanks] = useState<Bank[]>([]);

  const form = useForm<CompensationFormValues>({
    resolver: zodResolver(formSchema),
    // Correctly initialize defaultValues from props
    defaultValues: {
        ...defaultValues,
        allowances_json: defaultValues.allowances_json || [],
        non_cash_benefits_json: defaultValues.non_cash_benefits_json || [],
        other_deductions_json: defaultValues.other_deductions_json || [],
    },
    mode: 'onBlur',
  });


  const { fields: allowanceFields, append: appendAllowance, remove: removeAllowance } = useFieldArray({ control: form.control, name: 'allowances_json' });
  const { fields: benefitFields, append: appendBenefit, remove: removeBenefit } = useFieldArray({ control: form.control, name: 'non_cash_benefits_json' });
  const { fields: deductionFields, append: appendDeduction, remove: removeDeduction } = useFieldArray({ control: form.control, name: 'other_deductions_json' });

  const paymentMethod = form.watch('payment_method');
  const selectedBankName = form.watch('bank_name');
  const isHelbPaying = form.watch('is_helb_paying');
  const payeTaxExemption = form.watch('paye_tax_exemption');

  useEffect(() => {
    const fetchBanks = async () => {
      if (!accessToken) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/data/banks`, { headers: { Authorization: `Bearer ${accessToken}` } });
        setBanks(response.data.banks || []);
      } catch (error) {
        console.error("Failed to fetch banks", error);
        toast.error("Could not load bank data.");
      }
    };
    fetchBanks();
  }, [accessToken]);

  const selectedBankBranches = banks.find(b => b.name === selectedBankName)?.branches || [];

  useImperativeHandle(ref, () => ({
    trigger: async () => await form.trigger(),
    getValues: () => form.getValues(),
  }));
  
  interface DynamicItemRowProps {
    control: import('react-hook-form').Control<CompensationFormValues>;
    name: 'allowances_json' | 'non_cash_benefits_json' | 'other_deductions_json';
    field: { id: string };
    index: number;
    remove: (index: number) => void;
  }

  const DynamicItemRow = ({ control, name, field, index, remove }: DynamicItemRowProps) => (
    <div key={field.id} className="flex items-start gap-2 mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
        <FormField control={control} name={`${name}.${index}.type`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Type</FormLabel><FormControl><Input placeholder="e.g., Housing" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={control} name={`${name}.${index}.calculation_type`} render={({ field }) => (<FormItem className="w-32"><FormLabel className="text-xs">Calc Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Amount">Amount</SelectItem><SelectItem value="Percentage">Percentage</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        <FormField control={control} name={`${name}.${index}.value`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Value</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000 or 10(%)" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <Button type="button" variant="destructive" size="icon" className="mt-6" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );

  return (
    <Form {...form}>
      <form className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="basic_salary" render={({ field }) => (<FormItem><FormLabel>Basic Salary (KSH)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50000" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="payment_method" render={({ field }) => (<FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Payment Method" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="M-Pesa">M-Pesa</SelectItem><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Cash">Cash</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>

        {paymentMethod === 'Bank Transfer' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border border-dashed rounded-lg">
                <FormField control={form.control} name="bank_name" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Bank" /></SelectTrigger></FormControl><SelectContent>{banks.map(bank => (<SelectItem key={bank.code} value={bank.name}>{bank.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bank_branch" render={({ field }) => (<FormItem><FormLabel>Bank Branch</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger></FormControl><SelectContent>{selectedBankBranches.map(branch => (<SelectItem key={branch.code} value={branch.name}>{branch.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bank_account_number" render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><Input placeholder="e.g., 0123456789" {...field} /><FormMessage /></FormItem>)} />
            </div>
        )}
        {paymentMethod === 'M-Pesa' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border border-dashed rounded-lg"><FormField control={form.control} name="mpesa_phone_number" render={({ field }) => (<FormItem><FormLabel>M-Pesa Phone Number</FormLabel><Input placeholder="e.g., 0712345678" {...field} /><FormMessage /></FormItem>)} /></div>
        )}
        
        <Separator />

        {/* FIX: Restored the Statutory Details section */}
        <h3 className="text-lg font-medium">Statutory Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField control={form.control} name="kra_pin" render={({ field }) => (<FormItem><FormLabel>KRA PIN</FormLabel><FormControl><Input placeholder="A000000000Z" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="nssf_number" render={({ field }) => (<FormItem><FormLabel>NSSF Number</FormLabel><FormControl><Input placeholder="Enter NSSF Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="shif_number" render={({ field }) => (<FormItem><FormLabel>SHIF Number</FormLabel><FormControl><Input placeholder="Enter SHIF Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2 rounded-md border p-4"><FormField control={form.control} name="paye_tax_exemption" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Has PAYE Tax Exemption?</FormLabel></FormItem>)} />
                {payeTaxExemption && <FormField control={form.control} name="paye_exemption_certificate_number" render={({ field }) => (<FormItem className="mt-2"><FormControl><Input placeholder="Enter PAYE Cert. No." {...field} /></FormControl><FormMessage /></FormItem>)} />}
            </div>
            <div className="space-y-2 rounded-md border p-4"><FormField control={form.control} name="is_helb_paying" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Is paying HELB?</FormLabel></FormItem>)} />
                {isHelbPaying && <div className="grid grid-cols-2 gap-4 mt-2">
                    <FormField control={form.control} name="helb_account_number" render={({ field }) => (<FormItem><FormControl><Input placeholder="HELB Account No." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="helb_monthly_deduction_amount" render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="Monthly Amount" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>}
            </div>
        </div>

        <Separator />
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Earnings & Deductions</h3>
          <div><h4 className="font-medium text-gray-600 dark:text-gray-400">Allowances</h4>
            {allowanceFields.map((field, index) => (<DynamicItemRow key={field.id} control={form.control} name="allowances_json" field={field} index={index} remove={removeAllowance} />))}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendAllowance({ type: '', calculation_type: 'Amount', value: 0 })}><PlusCircle className="mr-2 h-4 w-4" />Add Allowance</Button>
          </div>
          <div><h4 className="font-medium text-gray-600 dark:text-gray-400">Non-Cash Benefits</h4>
            {benefitFields.map((field, index) => (<DynamicItemRow key={field.id} control={form.control} name="non_cash_benefits_json" field={field} index={index} remove={removeBenefit} />))}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendBenefit({ type: '', calculation_type: 'Amount', value: 0 })}><PlusCircle className="mr-2 h-4 w-4" />Add Benefit</Button>
          </div>
          <div><h4 className="font-medium text-gray-600 dark:text-gray-400">Other Deductions</h4>
            {deductionFields.map((field, index) => (<DynamicItemRow key={field.id} control={form.control} name="other_deductions_json" field={field} index={index} remove={removeDeduction} />))}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendDeduction({ type: '', calculation_type: 'Amount', value: 0 })}><PlusCircle className="mr-2 h-4 w-4" />Add Deduction</Button>
          </div>
        </div>
      </form>
    </Form>
  );
});

export default CompensationStep;
