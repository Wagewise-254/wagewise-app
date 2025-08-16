// src/pages/dashboard/RootDashboard.tsx
import { useEffect, useState, useMemo } from 'react';
import { useCompanyStore } from '@/stores/companyStore';
import { CompanyCard } from '@/components/dashboard/CompanyCard';
import { AddCompanyDialog } from '@/components/dashboard/AddCompanyDialog';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react'; // <-- Import spinner

const RootDashboard = () => {
  const { companies, fetchCompanies, loading } = useCompanyStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Filtered list based on search term
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) =>
      company.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.business_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.kra_pin?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  return (
    <div className="container mx-auto">
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-6">
        <Input
          placeholder="Search for company"
          className="max-w-xs bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Add Company Card */}
          <AddCompanyDialog />
          
          {/* Existing Company Cards */}
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No companies found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RootDashboard;
