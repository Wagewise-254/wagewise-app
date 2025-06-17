// src/pages/dashboard/employee/EmployeePage.tsx 

import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import SideNav from "@/components/dashboard/layout/sideNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImportEmployeesDialog from "@/components/dashboard/employee/ImportEmployeesDialog"; 
import { FileDown } from "lucide-react";
import ExportEmployeesDialog from "@/components/dashboard/employee/ExportEmployeesDialog";
import EmployeeTable from "@/components/dashboard/employee/EmployeeTable";

const EmployeePage = () => {
  const navigate = useNavigate();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Handle search input change
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };


  const handleDataChange = () => {
    console.log("Employee data changed. Triggering refetch.");
    setRefetchTrigger((prev) => prev + 1);
    console.log("Refetch Triggered:", refetchTrigger);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <SideNav />
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-6 h-full overflow-hidden">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            Employee Management
          </h1>

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
            <div className="flex flex-col sm:flex-row gap-3 ">
              <Button className="bg-[#7F5EFD] hover:bg-[#6a4fdd] cursor-pointer" onClick={() => navigate('/employee/add')}>
                Add Employee
              </Button>

              <Button
                variant="outline"
                className="text-[#7F5EFD] hover:bg-[#f3f0ff] hover:text-[#6a4fdd] cursor-pointer"
                onClick={() => setIsImportDialogOpen(true)}
              >
                Import
              </Button>
              <Button
                variant="outline"
                className="text-[#7F5EFD] hover:bg-[#f3f0ff] hover:text-[#6a4fdd] cursor-pointer"
                onClick={() => setIsExportDialogOpen(true)}
              >
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
      </div>
    </div>
  );
};

export default EmployeePage;
