// src/pages/dashboard/employee/EmployeePage.tsx - Updated with Edit Dialog

import React, { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
// Keep necessary imports like API_BASE_URL, Button, Input, toast, etc.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
//import { toast } from 'sonner'; // Ensure toast is imported
import ImportEmployeesDialog from '@/components/dashboard/employee/ImportEmployeesDialog'; // Import the import dialog
import { FileDown } from 'lucide-react'; // Icon for download
// Import the new ExportEmployeesDialog
import ExportEmployeesDialog from '@/components/dashboard/employee/ExportEmployeesDialog';
// Import the AddEmployeeDialog using your specified path
import AddEmployeeDialog from '@/components/dashboard/employee/AddEmployeeSteps/AddEmployeeDialog';
// Import the new EmployeeTable component and the Employee type from it
import EmployeeTable, { Employee } from '@/components/dashboard/employee/EmployeeTable';
// Import the EditEmployeeDialog using your specified path
import EditEmployeeDialog from "@/components/dashboard/employee/AddEmployeeSteps/EditEmployeeDialog";


// Use the Employee type from EmployeeTable for consistency
// type EmployeeDataForEdit = Employee; // No need to redefine if Employee is sufficient

const EmployeePage = () => {

  // State to control the visibility of dialogs
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  // State for the Edit Employee Dialog
  const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = useState(false);
  // State to hold the data of the employee being edited
  // Use the Employee type imported from EmployeeTable
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);


  // State for the search input
  const [searchTerm, setSearchTerm] = useState('');

  // State to trigger data refetch in the table
  // This state is just toggled to notify the table useEffect to refetch
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Handle search input change
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Client-side filtering is handled by passing searchTerm to EmployeeTable
    // For server-side, this would potentially trigger a fetch
  };

  // Function to trigger a data refetch in the table
  // This function will be called after successful Add or Import or Delete or Edit
  const handleDataChange = () => {
      console.log("Employee data changed. Triggering refetch.");
      // Increment state to trigger useEffect in EmployeeTable.
      // The value itself doesn't matter, just that it changes.
      setRefetchTrigger(prev => prev + 1);
      console.log("Refetch Triggered:", refetchTrigger);
  };

  // Function to handle opening the Edit dialog
  // Accepts the Employee object directly from the table row
  const handleEditEmployee = (employee: Employee) => {
      // Set the employee data directly. The 'id' is already correct here.
      setEmployeeToEdit(employee);
      setIsEditEmployeeDialogOpen(true); // Open the dialog
  };

  // Function to handle closing the Edit dialog
  const handleCloseEditDialog = () => {
      setIsEditEmployeeDialogOpen(false);
      setEmployeeToEdit(null); // Clear the employee data when closing
  };


return (
  <div className="flex h-screen bg-gray-100">
    <SideNav />
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Employee Management</h1>

      {/* Main Card Container */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-6 h-full overflow-hidden">
        
        {/* Top bar: Search and Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Search Input */}
          <div className="w-full sm:w-1/3">
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => setIsAddEmployeeDialogOpen(true)}>Add Employee</Button>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>Import</Button>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Employee Table with scrollable area */}
        <div className="flex-1 overflow-auto">
          <EmployeeTable
            searchTerm={searchTerm}
            onDataChange={handleDataChange}
            onEditEmployee={handleEditEmployee}
          />
        </div>
      </div>

      {/* Dialogs */}
      <ImportEmployeesDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={handleDataChange}
      />
      <ExportEmployeesDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
      <AddEmployeeDialog
        isOpen={isAddEmployeeDialogOpen}
        onClose={() => setIsAddEmployeeDialogOpen(false)}
        onEmployeeAdded={handleDataChange}
      />
      {employeeToEdit && (
        <EditEmployeeDialog
          isOpen={isEditEmployeeDialogOpen}
          onClose={handleCloseEditDialog}
          employeeData={employeeToEdit}
          onEmployeeUpdated={handleDataChange}
        />
      )}
    </div>
  </div>
);
}

export default EmployeePage;
