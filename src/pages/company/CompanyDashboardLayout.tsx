// src/pages/company/CompanyDashboardLayout.tsx
//import React from 'react';
import { Outlet } from 'react-router-dom';
import CompanyTopBar from '@/components/company/layout/CompanyTopBar';
import CompanySidebar from '@/components/company/layout/CompanySidebar';
import OfflineBanner from '@/components/common/OfflineBanner';

const CompanyDashboardLayout = () => {
  return (
    <div className="flex flex-col h-screen">
      <OfflineBanner /> {/* Global offline indicator */}
      <CompanyTopBar />
      <div className="flex flex-1">
        <CompanySidebar />
        <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CompanyDashboardLayout;