// src/components/settings/OverviewSettingsSection.tsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCompanyStore } from "@/stores/companyStore";
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OverviewSettingsSection() {
  // Maintenance flag
  const underMaintenance = false; // Set to false to enable functionality
  const { companies, updateCompany, loading, error } = useCompanyStore();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string>('active');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleStatusChange = (value: string) => {
    setCompanyStatus(value);
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

  // For demonstration, let's assume we have a selected company to display.
  const currentCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 🔔 Maintenance Banner */}
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
        <Select onValueChange={setSelectedCompanyId}>
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
      
      {/* Basic Info (Your Existing Code) */}
      <div className="bg-white rounded-xl shadow p-6 space-y-8 mb-8">
        <h2 className="text-xl font-bold">Business Information</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <Input value={currentCompany?.business_name || ""} placeholder="Business Name" disabled={true} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Company Email</label>
          <Input value={currentCompany?.company_email || ""} placeholder="Company Email" disabled={underMaintenance} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Company Phone</label>
          <Input value={currentCompany?.company_phone || ""} placeholder="Company Phone" disabled={underMaintenance} />
        </div>
        {/* You can add a save button here for this section */}
      </div>

      {/* Section 2: Change Company Logo */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4 mb-8">
        <h2 className="text-xl font-bold">Change Company Logo</h2>
        <div>
          {currentCompany?.logo_url && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Current Logo:</p>
              <img src={currentCompany.logo_url} alt="Company Logo" className="w-24 h-24 object-contain" />
            </div>
          )}
          <label className="block text-sm font-medium mb-1">Upload New Logo</label>
          <Input type="file" onChange={handleLogoChange} disabled={underMaintenance} />
        </div>
        <Button className="cursor-pointer bg-[#7F5EFD]" onClick={() => handleUpdate('logo')} disabled={underMaintenance || !logoFile}>
          Save Logo
        </Button>
      </div>

      {/* Section 3: Change Company Status */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-bold">Company Status</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Set Company Status</label>
          <Select onValueChange={handleStatusChange} value={companyStatus} disabled={underMaintenance}>
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
        <Button onClick={() => handleUpdate('status')} className="cursor-pointer bg-[#7F5EFD]" disabled={underMaintenance}>
          {loading ? <span>Updating...</span> : <span>Update Status</span>}
        </Button>
      </div>
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
}