import { useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

// FIX: Added all relevant fields for this step from the schema
const formSchema = z.object({
  employee_number: z.string().min(1, { message: 'Employee number is required.' }),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  other_names: z.string().optional(),
  date_of_birth: z.date({ required_error: 'Date of birth is required.' }),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required.' }),
  marital_status: z.enum(['Single', 'Married', 'Divorced', 'Widowed']).optional(),
  citizenship: z.string().optional(),
  id_type: z.enum(['National ID', 'Passport'], { required_error: 'ID type is required.' }),
  id_number: z.string().min(5, 'ID number is required'),
  has_disability: z.boolean().default(false).optional(),
  disability_exemption_certificate_number: z.string().optional(),
}).refine(data => {
    if (data.has_disability) {
        return !!data.disability_exemption_certificate_number;
    }
    return true;
}, {
    message: "Certificate number is required if employee has disability.",
    path: ["disability_exemption_certificate_number"],
});

type PersonalDetailsFormValues = z.infer<typeof formSchema>;

export interface StepFormRef {
  trigger: () => Promise<boolean>;
  getValues: () => PersonalDetailsFormValues;
}

interface PersonalDetailsStepProps {
  defaultValues: Partial<PersonalDetailsFormValues>;
}

const PersonalDetailsStep = forwardRef<StepFormRef, PersonalDetailsStepProps>(({ defaultValues }, ref) => {
  const form = useForm<PersonalDetailsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultValues, citizenship: defaultValues.citizenship || 'Kenyan' },
    mode: 'onBlur',
  });

  const hasDisability = form.watch('has_disability');

  useImperativeHandle(ref, () => ({
    trigger: async () => await form.trigger(),
    getValues: () => form.getValues(),
  }));

  return (
    <Form {...form}>
      <form className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField control={form.control} name="employee_number" render={({ field }) => (<FormItem><FormLabel>Employee Number</FormLabel><FormControl><Input placeholder="e.g., EMP001" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="first_name" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="e.g., John" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="e.g., Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField control={form.control} name="other_names" render={({ field }) => (<FormItem><FormLabel>Other Names</FormLabel><FormControl><Input placeholder="e.g., Kamau" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="date_of_birth" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date('1930-01-01')} initialFocus captionLayout="dropdown" fromYear={1930} toYear={new Date().getFullYear()} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField control={form.control} name="marital_status" render={({ field }) => (<FormItem><FormLabel>Marital Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Marital Status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem><SelectItem value="Divorced">Divorced</SelectItem><SelectItem value="Widowed">Widowed</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="citizenship" render={({ field }) => (<FormItem><FormLabel>Citizenship</FormLabel><FormControl><Input placeholder="e.g., Kenyan" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="id_type" render={({ field }) => (<FormItem><FormLabel>ID Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select ID Type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="National ID">National ID</SelectItem><SelectItem value="Passport">Passport</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField control={form.control} name="id_number" render={({ field }) => (<FormItem><FormLabel>ID Number</FormLabel><FormControl><Input placeholder="Enter ID Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
             {/* Has Disability Checkbox */}
             <div className="flex items-center space-x-2 pt-8">
                <FormField control={form.control} name="has_disability" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Employee has a disability</FormLabel></div></FormItem>)} />
             </div>
        </div>

        {hasDisability && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-dashed rounded-lg">
                <FormField control={form.control} name="disability_exemption_certificate_number" render={({ field }) => (<FormItem><FormLabel>Disability Exemption Certificate No.</FormLabel><FormControl><Input placeholder="Enter Certificate Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        )}

      </form>
    </Form>
  );
});

export default PersonalDetailsStep;
