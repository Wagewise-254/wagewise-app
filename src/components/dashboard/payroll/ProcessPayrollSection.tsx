// src/components/dashboard/payroll/ProcessPayrollSection.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp, UserCheck } from 'lucide-react'; // Added TrendingUp and UserCheck for overview and quick links cards
import RunPayrollDialog from './RunPayrollDialog';

interface ProcessPayrollSectionProps {
  // Renamed prop for clarity, matches what PayrollPage provides
  onPayrollRunSuccess: (success: boolean, message?: string) => void;
}

const ProcessPayrollSection: React.FC<ProcessPayrollSectionProps> = ({ onPayrollRunSuccess }) => {
  const [isRunPayrollDialogOpen, setIsRunPayrollDialogOpen] = useState(false);

  return (
    <div className="p-2 md:p-4">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Start New Payroll Process</h2>
                <p className="text-sm text-gray-600 mt-1 mb-4 md:mb-0">
                    Initiate, calculate, and finalize payroll for the desired period.
                </p>
            </div>
            <Button onClick={() => setIsRunPayrollDialogOpen(true)} className="bg-[#7F5EFD] hover:bg-[#6a4fcf] text-white px-6 py-3">
                <PlusCircle className="mr-2 h-5 w-5" /> Run New Payroll
            </Button>
        </div>
      </div>

      {/* Optional: Placeholder for future overview elements */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center text-gray-700 mb-2">
                <TrendingUp className="h-6 w-6 mr-3 text-[#7F5EFD]" />
                <h3 className="text-lg font-semibold">Payroll Overview</h3>
            </div>
            <p className="text-sm text-gray-600">
                Summary of your company's payroll activity will appear here. (e.g., total paid last month, upcoming run alerts).
            </p>
            {/* Add charts or key figures later */}
        </div>
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center text-gray-700 mb-2">
                <UserCheck className="h-6 w-6 mr-3 text-green-500" />
                <h3 className="text-lg font-semibold">Employee Management Quick Links</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
                Access employee records or manage benefits.
            </p>
            <div className="flex space-x-3">
                <Button variant="outline" size="sm">View Employees</Button>
                <Button variant="outline" size="sm">Manage Benefits</Button>
            </div>
        </div>
      </div>


      <RunPayrollDialog
        isOpen={isRunPayrollDialogOpen}
        onClose={() => setIsRunPayrollDialogOpen(false)}
        onPayrollRunSuccess={onPayrollRunSuccess} // Pass the callback
      />
    </div>
  );
};

export default ProcessPayrollSection;