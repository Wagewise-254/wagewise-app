// src/pages/dashboard/employee/EmployeePage.tsx

import React, { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
//import { API_BASE_URL } from '@/config';
import { Button } from '@/components/ui/button'; // Import Button
import { Input } from '@/components/ui/input'; // Import Input for search
//import { toast } from 'sonner'; // Import toast for notifications
import ImportEmployeesDialog from '@/components/dashboard/employee/ImportEmployeesDialog'; // Import the import dialog
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
import { FileDown } from 'lucide-react'; // Icon for download
// Import the new ExportEmployeesDialog
import ExportEmployeesDialog from '@/components/dashboard/employee/ExportEmployeesDialog';
// Import the new AddEmployeeDialog
import AddEmployeeDialog from '@/components/dashboard/employee/AddEmployeeSteps/AddEmployeeDialog';
// Import the new EmployeeTable component
import EmployeeTable from '@/components/dashboard/employee/EmployeeTable';


//import EmployeeForm from "@/components/dashboard/employee/EmployeeForm";
const EmployeePage = () => {

  // State to control the visibility of the import dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  // State to control the visibility of the export dialog
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false); // NEW STATE
  // State to control the visibility of the add employee dialog
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false); // NEW STATE


  // State for the search input
  const [searchTerm, setSearchTerm] = useState('');

  // State to trigger data refetch in the table
  // This state is just toggled to notify the table useEffect to refetch
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Placeholder for handling search logic (will implement with table later)
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Implement filtering logic here based on searchTerm
  };
  // The handleExport logic will be moved to the ExportEmployeesDialog component

 // Function to trigger a data refetch in the table
  // This function will be called after successful Add or Import or Delete or Edit
  const handleDataChange = () => {
      console.log("Employee data changed. Triggering refetch.");
      setRefetchTrigger(prev => prev + 1); // Increment state to trigger useEffect in EmployeeTable
      console.log("Refetch trigger set to:", refetchTrigger);
  };

  return (
    <div className="flex h-screen bg-gray-100"> {/* Added background color */}
      <SideNav />
      <div className="flex-1 flex flex-col p-6 overflow-hidden"> {/* Added padding and overflow */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Employee Management</h1>

        {/* Top bar: Search, Add Employee, Import, Export */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"> {/* Added gap */}
          {/* Search Input */}
          <div className="w-full sm:w-1/3"> {/* Adjusted width */}
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3"> {/* Added gap */}
            {/* Add Employee Button (will open a dialog later) */}
            <Button onClick={() => setIsAddEmployeeDialogOpen(true)}> {/* Use NEW STATE */}
                Add Employee
            </Button>
            {/* Import Employees Button */}
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              Import Employees
            </Button>

            {/* Export Employees Dropdown */}
            <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}> {/* Use NEW STATE */}
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>

          </div>
        </div>

         {/* Employee Table Component */}
        <div className="flex-1 overflow-auto "> {/* Make table container scrollable */}
           <EmployeeTable
               searchTerm={searchTerm} // Pass the search term down
               onDataChange={handleDataChange} // Pass the refetch trigger callback
               // We will pass pagination state/callbacks here later for server-side
           />
        </div>

        {/* Import Employees Dialog */}
        <ImportEmployeesDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
        // onImportSuccess={() => { /* Optionally refetch employee data after import */ }}
        />

        {/* NEW: Export Employees Dialog */}
        <ExportEmployeesDialog
          isOpen={isExportDialogOpen} // Controlled by new state
          onClose={() => setIsExportDialogOpen(false)} // Close handler
        // Pass API_BASE_URL and toast if needed, or handle logic internally
        // handleExport is now internal to the dialog
        />

         {/* NEW: Add Employee Dialog */}
        <AddEmployeeDialog
            isOpen={isAddEmployeeDialogOpen} // Controlled by new state
            onClose={() => setIsAddEmployeeDialogOpen(false)} // Close handler
            onEmployeeAdded={handleDataChange} // Call handleDataChange on successful add
        />

      </div>
    </div>
  );
}
export default EmployeePage;
