// src/components/dashboard/payroll/ProcessPayrollSection.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import RunPayrollDialog from './RunPayrollDialog'; // Import the dialog

interface ProcessPayrollSectionProps {
  onPayrollRunSuccess: () => void; // Callback to trigger refetch in history section
}

const ProcessPayrollSection: React.FC<ProcessPayrollSectionProps> = ({ onPayrollRunSuccess }) => {
  const [isRunPayrollDialogOpen, setIsRunPayrollDialogOpen] = useState(false);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Process New Payroll</h2>
      <p className="text-gray-600 mb-6">Initiate a new payroll run for a selected month and year.</p>

      <div className="flex justify-start mb-6">
        <Button onClick={() => setIsRunPayrollDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Run New Payroll
        </Button>
      </div>

      {/* You can add more elements here, e.g., a summary of the latest payroll run */}
      {/* <div className="mt-8 p-4 border rounded-md bg-white">
        <h3 className="text-xl font-semibold mb-2">Current Payroll Status (Last Run)</h3>
        <p className="text-gray-700">Details about the most recent payroll run will appear here.</p>
      </div> */}

      {/* Run Payroll Dialog */}
      <RunPayrollDialog
        isOpen={isRunPayrollDialogOpen}
        onClose={() => setIsRunPayrollDialogOpen(false)}
        onPayrollRunSuccess={onPayrollRunSuccess}
      />
    </div>
  );
};

export default ProcessPayrollSection;
