import  { useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  physical_address: z.string().optional(),
  postal_address: z.string().optional(),
  county: z.string().optional(),
  postal_code: z.string().optional(),
  next_of_kin_name: z.string().optional(),
  next_of_kin_relationship: z.string().optional(),
  next_of_kin_phone: z.string().optional(),
});

type ContactKinFormValues = z.infer<typeof formSchema>;

export interface StepFormRef {
  trigger: () => Promise<boolean>;
  getValues: () => ContactKinFormValues;
}

interface ContactKinStepProps {
  defaultValues: Partial<ContactKinFormValues>;
}

const ContactKinStep = forwardRef<StepFormRef, ContactKinStepProps>(({ defaultValues }, ref) => {
  const form = useForm<ContactKinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
    mode: 'onBlur',
  });

  useImperativeHandle(ref, () => ({
    trigger: async () => await form.trigger(),
    getValues: () => form.getValues(),
  }));

  return (
    <Form {...form}>
      <form className="space-y-8">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g., 0712345678" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email </FormLabel><FormControl><Input placeholder="employee@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="physical_address" render={({ field }) => (<FormItem><FormLabel>Physical Address</FormLabel><FormControl><Input placeholder="e.g., 123 Main St" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="county" render={({ field }) => (<FormItem><FormLabel>County </FormLabel><FormControl><Input placeholder="e.g., Nairobi" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="postal_address" render={({ field }) => (<FormItem><FormLabel>Postal Address </FormLabel><FormControl><Input placeholder="P.O. Box 12345" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="postal_code" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="e.g., 00100" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>

        <Separator />
        
        <h3 className="text-lg font-medium">Next of Kin (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <FormField control={form.control} name="next_of_kin_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="next_of_kin_relationship" render={({ field }) => (<FormItem><FormLabel>Relationship</FormLabel><FormControl><Input placeholder="e.g., Spouse" {...field} /></FormControl><FormMessage /></FormItem>)} />
             <FormField control={form.control} name="next_of_kin_phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g., 0787654321" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
      </form>
    </Form>
  );
});

export default ContactKinStep;
