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
import { Textarea } from '@/components/ui/textarea';

// Schema for Step 3: Job & Employment
const formSchema = z.object({
  job_title: z.string().optional(),
  department: z.string().optional(),
  date_joined: z.date({ required_error: 'Date joined is required.' }),
  job_type: z.enum(['Permanent', 'Contract', 'Part-time', 'Internship', 'Casual'], {
    required_error: 'Job type is required.',
  }),
  employee_status: z.enum(['Active', 'On Leave', 'Terminated', 'Probation', 'Confirmed'], {
    required_error: 'Employee status is required.',
  }),
  employee_status_effective_date: z.date().optional(),
  end_of_probation_date: z.date().optional(),
  contract_start_date: z.date().optional(),
  contract_end_date: z.date().optional(),
  termination_date: z.date().optional(),
  termination_reason: z.string().optional(),
}).refine(data => {
    if (data.job_type === 'Contract') return !!data.contract_start_date;
    return true;
}, { message: "Start date is required for contracts.", path: ["contract_start_date"] })
.refine(data => {
    if (data.job_type === 'Contract') return !!data.contract_end_date;
    return true;
}, { message: "End date is required for contracts.", path: ["contract_end_date"] })
.refine(data => {
    if (data.employee_status === 'Terminated') return !!data.termination_date;
    return true;
}, { message: "Termination date is required.", path: ["termination_date"] });

type JobDetailsFormValues = z.infer<typeof formSchema>;

export interface StepFormRef {
  trigger: () => Promise<boolean>;
  getValues: () => JobDetailsFormValues;
}

interface JobDetailsStepProps {
  defaultValues: Partial<JobDetailsFormValues>;
}

const JobDetailsStep = forwardRef<StepFormRef, JobDetailsStepProps>(({ defaultValues }, ref) => {
  const form = useForm<JobDetailsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const jobType = form.watch('job_type');
  const employeeStatus = form.watch('employee_status');

  useImperativeHandle(ref, () => ({
    trigger: async () => await form.trigger(),
    getValues: () => form.getValues(),
  }));

  const datePicker = (fieldName: keyof JobDetailsFormValues) => (
    <FormField control={form.control} name={fieldName} render={({ field }) => (
        <FormItem className="flex flex-col">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value as Date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value as Date} onSelect={field.onChange} initialFocus captionLayout="dropdown" fromYear={2010} toYear={new Date().getFullYear() + 10} />
                </PopoverContent>
            </Popover>
            <FormMessage />
        </FormItem>
    )} />
  );

  return (
    <Form {...form}>
      <form className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField control={form.control} name="job_title" render={({ field }) => (<FormItem><FormLabel>Job Title </FormLabel><FormControl><Input placeholder="e.g., Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department </FormLabel><FormControl><Input placeholder="e.g., Technology" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormItem><FormLabel>Date Joined</FormLabel>{datePicker('date_joined')}</FormItem>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField control={form.control} name="job_type" render={({ field }) => (<FormItem><FormLabel>Job Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Job Type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Permanent">Permanent</SelectItem><SelectItem value="Contract">Contract</SelectItem><SelectItem value="Part-time">Part-time</SelectItem><SelectItem value="Internship">Internship</SelectItem><SelectItem value="Casual">Casual</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="employee_status" render={({ field }) => (<FormItem><FormLabel>Employee Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Probation">Probation</SelectItem><SelectItem value="Confirmed">Confirmed</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="On Leave">On Leave</SelectItem><SelectItem value="Terminated">Terminated</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormItem><FormLabel>Status Effective Date</FormLabel>{datePicker('employee_status_effective_date')}</FormItem>
        </div>
        
        {employeeStatus === 'Probation' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border border-dashed rounded-lg"><FormItem className="col-span-1"><FormLabel>End of Probation Date</FormLabel>{datePicker('end_of_probation_date')}</FormItem></div>
        )}

        {jobType === 'Contract' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-dashed rounded-lg">
                <FormItem><FormLabel>Contract Start Date</FormLabel>{datePicker('contract_start_date')}</FormItem>
                <FormItem><FormLabel>Contract End Date</FormLabel>{datePicker('contract_end_date')}</FormItem>
            </div>
        )}

        {employeeStatus === 'Terminated' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-dashed rounded-lg">
                <FormItem><FormLabel>Termination Date</FormLabel>{datePicker('termination_date')}</FormItem>
                <FormField control={form.control} name="termination_reason" render={({ field }) => (<FormItem><FormLabel>Termination Reason (Opt)</FormLabel><FormControl><Textarea placeholder="Reason for termination..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        )}

      </form>
    </Form>
  );
});

export default JobDetailsStep;
