// src/pages/dashboard/payroll/PayrollPage.tsx - Updated with Active Tab Indicator

import { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Make sure this import path is correct for your project

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

  // Define Tailwind classes for active and inactive tabs
  const activeTabClasses = "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
  const inactiveTabClasses = "text-gray-600 hover:text-gray-800";

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Payroll Management</h1>

        {/* Mini-Navigation (Tabs) */}
        {/* Adjusted border-b and removed pb-2 */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <Button
            variant="ghost" // Use ghost variant for full custom styling control
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200", // Base styles
              currentTab === 'process' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentTab('process')}
          >
            Process Payroll
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200",
              currentTab === 'history' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentTab('history')}
          >
            Payroll History
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200",
              currentTab === 'reports' ? activeTabClasses : inactiveTabClasses
            )}
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
