// src/pages/dashboard/reports/ReportsPage.tsx

import { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Company Reports & Analytics</h1>

        {/* Mini-Navigation (Tabs) */}
        <div className="flex space-x-4 border-b pb-2 mb-6">
          <Button
            variant={currentReportTab === 'overview' ? 'secondary' : 'ghost'}
            onClick={() => setCurrentReportTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant={currentReportTab === 'employees' ? 'secondary' : 'ghost'}
            onClick={() => setCurrentReportTab('employees')}
          >
            Employee Reports
          </Button>
          <Button
            variant={currentReportTab === 'payroll' ? 'secondary' : 'ghost'}
            onClick={() => setCurrentReportTab('payroll')}
          >
            Payroll Reports
          </Button>
          <Button
            variant={currentReportTab === 'tax' ? 'secondary' : 'ghost'}
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
