// src/pages/dashboard/employee/EmployeePage.tsx - Updated with Import Button

import React, { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button'; // Import Button
import { Input } from '@/components/ui/input'; // Import Input for search
import ImportEmployeesDialog from '@/components/dashboard/employee/ImportEmployeesDialog'; // Import the import dialog

//import EmployeeForm from "@/components/dashboard/employee/EmployeeForm";
const EmployeePage = () => {

  // State to control the visibility of the import dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // State for the search input
  const [searchTerm, setSearchTerm] = useState('');

  // Placeholder for handling search logic (will implement with table later)
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Implement filtering logic here based on searchTerm
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
                className="w-full"
             />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3"> {/* Added gap */}
            {/* Add Employee Button (will open a dialog later) */}
            <Button>Add Employee</Button> {/* Placeholder */}

            {/* Import Employees Button */}
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                Import Employees
            </Button>

            {/* Export Employees Button (will implement later) */}
            <Button variant="outline">Export Employees</Button> {/* Placeholder */}
          </div>
        </div>

        {/* Employee Table (Placeholder) */}
        <div className="flex-1 overflow-auto"> {/* Make table area scrollable */}
           <div className="bg-white p-4 rounded-lg shadow-md h-full flex items-center justify-center text-gray-500">
               Employee Table will go here...
           </div>
        </div>

        {/* Import Employees Dialog */}
        <ImportEmployeesDialog
            isOpen={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            // Add any other props needed for the dialog (e.g., onImportSuccess)
        />

      </div>
       {/* <EmployeeForm /> */} {/* Keep commented out */}
    </div>
  );
}
export default EmployeePage;