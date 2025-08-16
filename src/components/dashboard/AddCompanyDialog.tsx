import { useState } from 'react';
import { useCompanyStore } from '@/stores/companyStore';
import type { Company } from '@/stores/companyStore';
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
import { Plus, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import clsx from 'clsx';

export const AddCompanyDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({
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

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, business_type: value }));
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
      toast.error(error instanceof Error ? error.message : 'Failed to add company.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="flex items-center justify-center p-6 h-40 w-full border-2 border-dashed hover:bg-gray-50 transition-colors cursor-pointer">
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
          {/* Business Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="business_name" className="text-right">Business Name</Label>
            <Input id="business_name" value={formData.business_name} onChange={handleInputChange} className="col-span-3" />
          </div>

          {/* Business Type - Dropdown */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="business_type" className="text-right">Business Type</Label>
            <Select value={formData.business_type} onValueChange={handleSelectChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LLC">Limited Liability Company</SelectItem>
                <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="Public Company">Public Company</SelectItem>
                <SelectItem value="NGO / Non-Profit">NGO / Non-Profit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Other Inputs */}
          {[
            { id: 'kra_pin', label: 'KRA PIN' },
            { id: 'nssf_employer', label: 'NSSF No.' },
            { id: 'shif_employer', label: 'SHIF No.' },
            { id: 'helb_employer', label: 'HELB No.' },
            { id: 'housing_levy_employer', label: 'Housing Levy No.' },
            { id: 'address', label: 'Address' },
            { id: 'company_phone', label: 'Phone' },
            { id: 'company_email', label: 'Email' },
          ].map((field) => (
            <div key={field.id} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field.id} className="text-right">{field.label}</Label>
              <Input id={field.id} value={formData[field.id as keyof Company] ?? ""} onChange={handleInputChange} className="col-span-3" />
            </div>
          ))}

          {/* Logo Upload - Modern Dashed Border */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="logo" className="text-right">Company Logo</Label>
            <label
              htmlFor="logo"
              className={clsx(
                "col-span-3 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition hover:bg-gray-50",
                logoFile ? "border-green-500" : "border-gray-300"
              )}
            >
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">
                {logoFile ? logoFile.name : "Click or drag to upload logo"}
              </span>
              <Input id="logo" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
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
