// src/components/dashboard/AddCompanyDialog.tsx
import { useState } from 'react';
import { useCompanyStore } from '@/stores/companyStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export const AddCompanyDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    kra_pin: '',
    nssf_employer: '',
    shif_employer: '',
    helb_employer: '',
    housing_levy_employer: '',
    address: '',
    company_phone: '',
    company_email: '',
  });
  const [logoFile, setLogoFile] = useState<File | undefined>();
  const { addCompany, loading } = useCompanyStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.business_name) {
      toast.error('Business Name is required.');
      return;
    }
    
    try {
      // Create a FormData object to handle both text and file data
      const dataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        dataToSend.append(key, value);
      });
      if (logoFile) {
        dataToSend.append('logo', logoFile);
      }

      await addCompany(dataToSend);
      toast.success('Company added successfully!');
      setIsOpen(false);
      // Reset form
      setFormData({
        business_name: '',
        business_type: '',
        kra_pin: '',
        nssf_employer: '',
        shif_employer: '',
        helb_employer: '',
        housing_levy_employer: '',
        address: '',
        company_phone: '',
        company_email: '',
      });
      setLogoFile(undefined);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add company.');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
       {/* New trigger UI: a card with a dashed border and a plus icon */}
        <Card className="flex items-center justify-center p-6 h-48 w-full border-2 border-dashed hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center p-0">
            <Plus className="h-8 w-8 text-muted-foreground" />
            <span className="mt-2 text-sm text-muted-foreground">Add Company</span>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Company Onboarding</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new company to your profile.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="business_name" className="text-right">Business Name</Label>
            <Input id="business_name" value={formData.business_name} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="business_type" className="text-right">Business Type</Label>
            <Input id="business_type" value={formData.business_type} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="kra_pin" className="text-right">KRA PIN</Label>
            <Input id="kra_pin" value={formData.kra_pin} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nssf_employer" className="text-right">NSSF No.</Label>
            <Input id="nssf_employer" value={formData.nssf_employer} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shif_employer" className="text-right">SHIF No.</Label>
            <Input id="shif_employer" value={formData.shif_employer} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="helb_employer" className="text-right">HELB No.</Label>
            <Input id="helb_employer" value={formData.helb_employer} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="housing_levy_employer" className="text-right">Housing Levy No.</Label>
            <Input id="housing_levy_employer" value={formData.housing_levy_employer} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Address</Label>
            <Input id="address" value={formData.address} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company_phone" className="text-right">Phone</Label>
            <Input id="company_phone" value={formData.company_phone} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company_email" className="text-right">Email</Label>
            <Input id="company_email" value={formData.company_email} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="logo" className="text-right">Company Logo</Label>
            <Input id="logo" type="file" onChange={handleFileChange} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Company Details'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};