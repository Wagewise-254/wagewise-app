// src/pages/company/layout/moduleLayout.tsx
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainSidebar from '@/components/layout/MainSidebar';
import MainTopBar from '@/components/layout/MainTopBar';
import OfflineBanner from '@/components/common/OfflineBanner';

const MainLayout = () => {
  const { companyId } = useParams();
  const [companyName, setCompanyName] = useState<string>();
  const [companyLogo, setCompanyLogo] = useState<string>();
  const { companies: companyMemberships } = useAuthStore();

  useEffect(() => {
    const company = companyMemberships.find((m) => m.companies.id === companyId);
    if (company) {
      setCompanyName(company.companies.business_name);
      setCompanyLogo(company.companies.logo_url);
    }
  }, [companyId, companyMemberships]);

  const handleGlobalSearch = (query: string) => {
    // Implement global search functionality
    console.log('Searching for:', query);
    // You can navigate to a search results page or filter data
  };

 return (
  <div className="flex h-screen overflow-hidden bg-slate-50">
    {/* Sidebar full height */}
    <MainSidebar
      companyName={companyName}
      companyLogo={companyLogo}
    />

    {/* Right Side */}
    <div className="flex flex-col flex-1 overflow-hidden">
      <OfflineBanner />
      <MainTopBar onSearch={handleGlobalSearch} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);
};

export default MainLayout;