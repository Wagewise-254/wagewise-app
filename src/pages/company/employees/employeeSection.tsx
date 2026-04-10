// pages/company/employees/employeeSection.tsx
import { Button } from "@/components/ui/button";
import { Plus, CloudUpload, Download, Search } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import ImportEmployeeDialog from "@/components/company/employees/ImportEmployeeDialog";
import EmployeeTableWrapper from "@/components/company/employees/EmployeeTableWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

export default function EmployeeSection() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="h-full flex flex-col">
      {/* Unified Action Bar */}
      <div className="shrink-0 flex items-center justify-end gap-2 pb-3">
        <div className="flex items-center gap-1">
          {/* Search with toggle */}
          <TooltipProvider>
            <div className="relative">
              {showSearch ? (
                <div className="relative animate-in slide-in-from-left-2 fade-in duration-200">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onBlur={() => {
                      if (!searchValue) setShowSearch(false);
                    }}
                    className="pl-8 h-8 w-64 text-sm bg-white border-slate-200 rounded-md focus-visible:ring-1 focus-visible:ring-[#7F5EFD]"
                    autoFocus
                  />
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSearch(true)}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <Search className="h-4 w-4 text-slate-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Search employees</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Import Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsImportDialogOpen(true)}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  <CloudUpload className="h-4 w-4 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Import employees (CSV/Excel)</TooltipContent>
            </Tooltip>

            {/* Export Button (Coming Soon) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-60 cursor-pointer"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Export employees (Coming soon)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Add Button - Visible on the right */}
        <Button
          onClick={() =>
            navigate(`/company/${companyId}/employees/add-employee`)
          }
          size="sm"
          className="h-8 text-xs rounded-sm cursor-pointer bg-[#7F5EFD] hover:bg-[#6a4ad3] shadow-none"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {/* Table Section - Takes full remaining space */}
      <div className="flex-1 overflow-hidden">
        <EmployeeTableWrapper 
          statusFilter="ACTIVE"
          globalSearchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      </div>

      <ImportEmployeeDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        fetchEmployees={() => {}}
      />
    </div>
  );
}