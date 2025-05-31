// src/pages/dashboard/payroll/PayrollPage.tsx

import { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import ProcessPayrollSection from '@/components/dashboard/payroll/ProcessPayrollSection';
import PayrollHistorySection from '@/components/dashboard/payroll/PayrollHistorySection';
import PayrollReportsSection from '@/components/dashboard/payroll/PayrollReportsSection';
import PayrollRunDetailsView from '@/components/dashboard/payroll/PayrollRunDetailsView'; // Import the new view

type PayrollTab = 'process' | 'history' | 'reports' | 'details'; // Added 'details' tab

const PayrollPage = () => {
  const [currentTab, setCurrentTab] = useState<PayrollTab>('process');
  const [refetchHistoryTrigger, setRefetchHistoryTrigger] = useState(0);
  const [selectedRunIdForDetailsView, setSelectedRunIdForDetailsView] = useState<string | null>(null);

  const handlePayrollProcessingComplete = (success: boolean, message?: string) => {
    if (success) {
      setRefetchHistoryTrigger(prev => prev + 1);
      setCurrentTab('history'); 
    } else {
       if (message && message.toLowerCase().includes('already exists')) {
            // No tab change
        } else {
            setCurrentTab('history'); 
        }
    }
  };

  const handleViewPayrollRunDetails = (runId: string) => {
    setSelectedRunIdForDetailsView(runId);
    setCurrentTab('details');
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'process':
        return <ProcessPayrollSection onPayrollRunSuccess={handlePayrollProcessingComplete} />;
      case 'history':
        return <PayrollHistorySection 
                    refetchTrigger={refetchHistoryTrigger} 
                    onViewDetails={handleViewPayrollRunDetails} // Pass the handler
                />;
      case 'reports':
        return <PayrollReportsSection />;
      case 'details':
        return <PayrollRunDetailsView payrollRunId={selectedRunIdForDetailsView} />;
      default:
        return null;
    }
  };

  const activeTabClasses = "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
  const inactiveTabClasses = "text-gray-500 hover:text-gray-700";

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <h1 className="text-3xl font-bold mb-4 mt-4 ml-4 text-gray-800">Payroll Management</h1>

        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
            <div className="flex space-x-4 border-b border-gray-200 mb-6">
            {[
                { id: 'process', label: 'Process Payroll' },
                { id: 'history', label: 'Payroll History' },
                { id: 'reports', label: 'Reports & Files' },
                // Conditionally render details tab or handle empty state in the component itself
                 { id: 'details', label: 'Run Details' } 
            ].map((tab) => (
                <Button
                key={tab.id}
                variant="ghost"
                disabled={tab.id === 'details' && !selectedRunIdForDetailsView && currentTab !== 'details'} // Disable if no run selected and not current
                className={cn(
                   "relative px-4 py-3 rounded-none transition-colors duration-200",
                    currentTab === tab.id ? `${activeTabClasses} bg-purple-50` : `${inactiveTabClasses} hover:bg-gray-100`,
                    (tab.id === 'details' && !selectedRunIdForDetailsView && currentTab !== 'details') ? "opacity-50 cursor-not-allowed" : ""
                )}
                onClick={() => {
                    if (tab.id === 'details' && !selectedRunIdForDetailsView && currentTab !== 'details') return; // Prevent click if disabled
                    setCurrentTab(tab.id as PayrollTab);
                }}
                >
                {tab.label}
                </Button>
            ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-transparent"> {/* Changed bg-white from here */}
            {renderTabContent()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;