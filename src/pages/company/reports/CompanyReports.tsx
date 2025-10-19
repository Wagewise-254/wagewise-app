//import React from "react";
import { useState, useMemo } from 'react';
import { useParams } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { useCompanyStore } from "@/stores/companyStore";
import { cn } from '@/lib/utils';
import  CompanyInactiveBanner  from "@/components/common/CompanyInactiveBanner";
import OfflineBanner from '@/components/common/OfflineBanner';

//import settings section components
import AnnualReportSection from '@/components/company/reports/ReportAnnualSection';
import P9Section from "@/components/company/payroll/payRuns/P9Section";
import PayrollFilesSection from "@/components/company/payroll/payRuns/PayrollFilesSection";

type SettingTab = 'annual' | 'payroll' | 'p9';

export default function CompanyReports() {
  const [currentSettingTab, setCurrentSettingTab] = useState<SettingTab>('annual');
  //const [error, setError] = useState<string | null>(null);
  const { companyId } = useParams<{ companyId: string }>();
  const { companies } = useCompanyStore();

   // Find the current company from store
      const company = useMemo(
        () => companies.find((c) => c.id === companyId),
        [companies, companyId]
      );
  
  
      // Handle inactive/suspended company
  if (company && company.status !== "active") {
    return (
      <CompanyInactiveBanner
        companyId={companyId!}
        status={company.status}
      />
    );
  }
  
  const renderTabContent = () => {
    switch (currentSettingTab) {
      case 'annual':
        return <AnnualReportSection />;
      case 'payroll':
        return <PayrollFilesSection />;
      case 'p9':
        return <P9Section />;
      default:
        return null;
    }
  };

    // Define Tailwind classes for active and inactive tabs
  const activeTabClasses = "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
  const inactiveTabClasses = "text-gray-600 hover:text-gray-800 ";

  return (
    <div className="flex h-auto bg-gray-100">
      <OfflineBanner />
      <div className="flex-1 flex flex-col p-6 bg-white rounded-md overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Company Reports</h1>

        {/* Mini-Navigation (Tabs) */}
        {/* Adjusted border-b and removed pb-2 */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <Button
            variant="ghost" // Use ghost variant for full custom styling control
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer", // Base styles
              currentSettingTab === 'annual' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentSettingTab('annual')}
          >
            Annual Reports
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer",
              currentSettingTab === 'payroll' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentSettingTab('payroll')}
          >
            Payroll Reports
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer",
              currentSettingTab === 'p9' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentSettingTab('p9')}
          >
            P9A Reports
          </Button>
        </div>

        {/* Content Area based on selected tab */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
}
