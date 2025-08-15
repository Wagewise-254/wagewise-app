// src/pages/dashboard/RootDashboard.tsx
import { useEffect } from 'react';
import { useCompanyStore } from '@/stores/companyStore';
import { CompanyCard } from '@/components/dashboard/CompanyCard';
import { AddCompanyDialog } from '@/components/dashboard/AddCompanyDialog';
import { Input } from '@/components/ui/input';

const RootDashboard = () => {
  const { companies, fetchCompanies, loading } = useCompanyStore();

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <div className="container mx-auto">
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-6">
        <Input placeholder="Search for company" className="max-w-xs bg-white" />
        {/* We use the Dialog's trigger for the main "Add Company" button now */}
      </div>

      {/* Companies Grid */}
      {loading && <p>Loading companies...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add Company Card */}
        <AddCompanyDialog />
        
        {/* Existing Company Cards */}
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  );
};

export default RootDashboard;