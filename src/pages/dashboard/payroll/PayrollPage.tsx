// src/pages/dashboard/payroll/PayrollPage.tsx - Consolidated with Tabs

import React, { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button'; // Assuming Button component is available

// Import the new section components
import ProcessPayrollSection from '@/components/dashboard/payroll/ProcessPayrollSection';
import PayrollHistorySection from '@/components/dashboard/payroll/PayrollHistorySection';
import PayrollReportsSection from '@/components/dashboard/payroll/PayrollReportsSection';

// Define the possible tabs for the mini-navigation
type PayrollTab = 'process' | 'history' | 'reports';

const PayrollPage = () => {
  // State to manage the currently active tab
  const [currentTab, setCurrentTab] = useState<PayrollTab>('process');
  // State to trigger refetch in PayrollHistorySection when a new payroll is run
  const [refetchHistoryTrigger, setRefetchHistoryTrigger] = useState(0);

  // Callback to be passed to ProcessPayrollSection to trigger history refetch
  const handlePayrollRunSuccess = () => {
    setRefetchHistoryTrigger(prev => prev + 1); // Increment to trigger useEffect in history
    setCurrentTab('history'); // Optionally switch to history tab after running payroll
  };

  // Function to render content based on the active tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'process':
        return <ProcessPayrollSection onPayrollRunSuccess={handlePayrollRunSuccess} />;
      case 'history':
        return <PayrollHistorySection refetchTrigger={refetchHistoryTrigger} />;
      case 'reports':
        return <PayrollReportsSection />; // Pass any necessary props later
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Payroll Management</h1>

        {/* Mini-Navigation (Tabs) */}
        <div className="flex space-x-4 border-b pb-2 mb-6">
          <Button
            variant={currentTab === 'process' ? 'secondary' : 'ghost'}
            onClick={() => setCurrentTab('process')}
          >
            Process Payroll
          </Button>
          <Button
            variant={currentTab === 'history' ? 'secondary' : 'ghost'}
            onClick={() => setCurrentTab('history')}
          >
            Payroll History
          </Button>
          <Button
            variant={currentTab === 'reports' ? 'secondary' : 'ghost'}
            onClick={() => setCurrentTab('reports')}
          >
            Reports & Files
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

export default PayrollPage;
