// src/components/settings/OverviewSettingsSection.tsx
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCompanyStore } from "@/stores/companyStore";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function OverviewSettingsSection() {
  // Maintenance flag
  const underMaintenance = false; // Set to false to enable functionality
  const { companies, updateCompany,  loading, error  } = useCompanyStore(); // removed this  transferCompany, fetchCompanies
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string>('active');
  const [transferRecipientEmail, setTransferRecipientEmail] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [companyPhone, setCompanyPhone] = useState<string>('');
  const [kraPin, setKraPin] = useState<string>('');

  const currentCompany = companies.find(c => c.id === selectedCompanyId);

  // Sync form fields with selected company data
  useEffect(() => {
    if (currentCompany) {
      setBusinessName(currentCompany.business_name);
      setCompanyEmail(currentCompany.company_email || '');
      setCompanyPhone(currentCompany.company_phone || '');
      setKraPin(currentCompany.kra_pin || '');
      setCompanyStatus(currentCompany.status || 'active');
    }
  }, [currentCompany]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleUpdateBasicInfo = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company first.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('business_name', businessName);
      formData.append('company_email', companyEmail);
      formData.append('company_phone', companyPhone);
      formData.append('kra_pin', kraPin);

      await updateCompany(selectedCompanyId, formData);
      toast.success("Company information updated successfully!");
    } catch (err) {
      toast.error(`Failed to update company information.`);
    }
  };

  const handleUpdate = async (field: 'logo' | 'status') => {
    if (!selectedCompanyId) {
      toast.error("Please select a company first.");
      return;
    }
    try {
      const formData = new FormData();
      if (field === 'logo' && logoFile) {
        formData.append('logo', logoFile);
      } else if (field === 'status') {
        formData.append('status', companyStatus);
      }
      await updateCompany(selectedCompanyId, formData);
      toast.success(`${field === 'logo' ? 'Logo' : 'Status'} updated successfully!`);
    } catch (err) {
      toast.error(`Failed to update ${field}.`);
    }
  };

  const handleTransferCompany = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company first.");
      return;
    }
    if (!transferRecipientEmail) {
      toast.error("Please enter a recipient email.");
      return;
    }
    toast.info("Transfer functionality is currently disabled for maintenance.");

    /*

    try {
      await transferCompany(selectedCompanyId, transferRecipientEmail);
      toast.success("Company ownership transferred successfully!");
      // Optionally redirect or refresh to show the company is gone
      setSelectedCompanyId(null);
      fetchCompanies(); // Refresh company list
    } catch (err) {
      toast.error(`Failed to transfer company ownership.`);
    } */
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {underMaintenance && (
        <Alert className="mb-6 border-yellow-400 bg-yellow-50">
          <AlertTitle>⚠️ Under Maintenance</AlertTitle>
          <AlertDescription>
            Company settings are temporarily disabled. Please check back later.
          </AlertDescription>
        </Alert>
      )}

      {/* Select Company Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select Company</label>
        <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId || ""}>
          <SelectTrigger>
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.business_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentCompany && (
        <>
          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-xl shadow p-6 space-y-8 mb-8">
            <h2 className="text-xl font-bold">Business Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business Name" disabled={underMaintenance} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">KRA PIN</label>
              <Input value={kraPin} onChange={(e) => setKraPin(e.target.value)} placeholder="KRA PIN" disabled={underMaintenance} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Email</label>
              <Input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="Company Email" disabled={underMaintenance} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Phone</label>
              <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="Company Phone" disabled={underMaintenance} />
            </div>
            <Button onClick={handleUpdateBasicInfo} className="cursor-pointer bg-[#7F5EFD]" disabled={underMaintenance || loading}>
              Save Basic Info
            </Button>
          </div>

          <hr className="my-8" />

          {/* Section 2: Change Company Logo */}
          <div className="bg-white rounded-xl shadow p-6 space-y-4 mb-8">
            <h2 className="text-xl font-bold">Change Company Logo</h2>
            <div>
              {currentCompany.logo_url && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Current Logo:</p>
                  <img src={currentCompany.logo_url} alt="Company Logo" className="w-24 h-24 object-contain" />
                </div>
              )}
              <label className="block text-sm font-medium mb-1">Upload New Logo</label>
              <Input type="file" onChange={handleLogoChange} disabled={underMaintenance} />
            </div>
            <Button className="cursor-pointer bg-[#7F5EFD]" onClick={() => handleUpdate('logo')} disabled={underMaintenance || !logoFile || loading}>
              Save Logo
            </Button>
          </div>

          <hr className="my-8" />

          {/* Section 3: Change Company Status */}
          <div className="bg-white rounded-xl shadow p-6 space-y-4 mb-8">
            <h2 className="text-xl font-bold">Company Status</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Set Company Status</label>
              <Select onValueChange={(value) => setCompanyStatus(value)} value={companyStatus} disabled={underMaintenance}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleUpdate('status')} className="cursor-pointer bg-[#7F5EFD]" disabled={underMaintenance || loading}>
              {loading ? <span>Updating...</span> : <span>Update Status</span>}
            </Button>
          </div>

          <hr className="my-8" />

          {/* Section 4: Transfer Company Ownership */}
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-xl font-bold text-red-600">Transfer Company Ownership</h2>
            <p className="text-sm text-gray-600">Transfer ownership of this company to another user. This action cannot be undone and will remove the company from your account.</p>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={underMaintenance || loading}>Transfer Company</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer Ownership of "{currentCompany.business_name}"</DialogTitle>
                  <DialogDescription>
                    This is a permanent action. Are you sure you want to transfer this company?
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="mb-2">Enter the email of the new owner. They must have an existing account.</p>
                  <Input 
                    placeholder="recipient@example.com" 
                    value={transferRecipientEmail}
                    onChange={(e) => setTransferRecipientEmail(e.target.value)}
                  />
                  {/* You would add a password field here for confirmation */}
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" className="text-white cursor-pointer" onClick={handleTransferCompany} disabled={loading || !transferRecipientEmail}>
                    {loading ? "Transferring..." : "Confirm Transfer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </>
      )}

      {error && <p className="text-red-500 mt-4">Error: {error}</p>}
    </div>
  );
}