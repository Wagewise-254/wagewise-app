// src/pages/dashboard/reports/ReportsPage.tsx - Updated with Active Tab Indicator

import { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Make sure this import path is correct for your project

// Import report section components
import OverviewReportSection from '@/components/dashboard/reports/OverviewReportSection';
import EmployeeReportSection from '@/components/dashboard/reports/EmployeeReportSection';
import PayrollReportSection from '@/components/dashboard/reports/PayrollReportSection';
import TaxReportSection from '@/components/dashboard/reports/TaxReportSection';

// Define the possible tabs for the mini-navigation
type ReportTab = 'overview' | 'employees' | 'payroll' | 'tax';

const ReportsPage = () => {
  const [currentReportTab, setCurrentReportTab] = useState<ReportTab>('overview');

  // Function to render content based on the active tab
  const renderTabContent = () => {
    switch (currentReportTab) {
      case 'overview':
        return <OverviewReportSection />;
      case 'employees':
        return <EmployeeReportSection />;
      case 'payroll':
        return <PayrollReportSection />;
      case 'tax':
        return <TaxReportSection />;
      default:
        return null;
    }
  };

  // Define Tailwind classes for active and inactive tabs
  const activeTabClasses = "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
  const inactiveTabClasses = "text-gray-600 hover:text-gray-800";

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Company Reports & Analytics</h1>

        {/* Mini-Navigation (Tabs) */}
        {/* Adjusted border-b and removed pb-2 */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <Button
            variant="ghost" // Use ghost variant for full custom styling control
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200", // Base styles
              currentReportTab === 'overview' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentReportTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200",
              currentReportTab === 'employees' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentReportTab('employees')}
          >
            Employee Reports
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200",
              currentReportTab === 'payroll' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentReportTab('payroll')}
          >
            Payroll Reports
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200",
              currentReportTab === 'tax' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentReportTab('tax')}
          >
            Tax Reports
          </Button>
        </div>

        {/* Content Area based on selected tab */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;
