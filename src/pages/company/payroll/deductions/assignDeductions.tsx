// src/pages/company/payroll/deductions/assignDeductions.tsx

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import {
  Loader2,
  Search,
  Plus,
  Download,
  CloudUpload,
  RefreshCw,
  Calendar,
  History,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DeductionAssignTable from "@/components/company/deductions/DeductionAssignTable";
import { AssignedDeduction } from "@/types/deduction";
import AddDeductionDialog, {
  Employee,
  Department,
  SubDepartment,
  JobTitle,
  DeductionType,
} from "@/components/company/deductions/AddDeductionDialog";
import EditDeductionDialog from "@/components/company/deductions/EditDeductionDialog";
import DeleteDeductionDialog from "@/components/company/deductions/DeleteDeductionDialog";
import ImportDeductionPreviewDialog from "@/components/company/deductions/ImportDeductionPreviewDialog";
import BulkDeleteDeductionDialog from "@/components/company/deductions/BulkDeleteDeductionDialog";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getCurrentMonth = () => MONTHS[new Date().getMonth()];
const getCurrentYear = () => new Date().getFullYear();

export default function AssignDeductions() {
  const { companyId } = useParams();
  const { session } = useAuthStore();
  const navigate = useNavigate();

  const [deductions, setDeductions] = useState<AssignedDeduction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  // Month/Year filters
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedTypeId, setSelectedTypeId] = useState<string>("all");
  
  // Cache reference
  const dataCache = useRef<Map<string, AssignedDeduction[]>>(new Map());
  const cacheKey = `${selectedMonth}|${selectedYear}|${selectedTypeId}`;

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState<AssignedDeduction | null>(null);
  const [deductionsToDelete, setDeductionsToDelete] = useState<string[]>([]);

  // Fetch reference data (employees, departments, etc.)
  const fetchReferenceData = useCallback(async () => {
    if (!companyId || !session) return;

    try {
      const headers = { Authorization: `Bearer ${session?.access_token}` };

      const [
        employeesResponse,
        departmentsResponse,
        subDepartmentsResponse,
        jobTitlesResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/company/${companyId}/employees`, { headers }),
        fetch(`${API_BASE_URL}/company/${companyId}/departments`, { headers }),
        fetch(`${API_BASE_URL}/company/${companyId}/sub-departments`, { headers }),
        fetch(`${API_BASE_URL}/company/${companyId}/job-titles`, { headers }),
      ]);

      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);
      }

      if (departmentsResponse.ok) {
        const departmentsData = await departmentsResponse.json();
        setDepartments(departmentsData);
      }

      if (subDepartmentsResponse.ok) {
        const subDepartmentsData = await subDepartmentsResponse.json();
        setSubDepartments(subDepartmentsData);
      }

      if (jobTitlesResponse.ok) {
        const jobTitlesData = await jobTitlesResponse.json();
        setJobTitles(jobTitlesData);
      }
    } catch (err) {
      console.error("Failed to fetch reference data", err);
    }
  }, [companyId, session]);

  const fetchDeductionTypes = useCallback(async () => {
    if (!companyId || !session) return;
    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/deduction-types`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDeductionTypes(data);
      }
    } catch (err) {
      console.error("Failed to fetch deduction types", err);
    }
  }, [companyId, session]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!companyId || !session) return;

    // Check cache
    if (!forceRefresh && dataCache.current.has(cacheKey)) {
      setDeductions(dataCache.current.get(cacheKey) || []);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}/company/${companyId}/deductions/monthly?month=${encodeURIComponent(selectedMonth)}&year=${selectedYear}`;
      if (selectedTypeId !== "all") {
        url += `&deduction_type_id=${selectedTypeId}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch deductions");
      }

      const data = await response.json();
      setDeductions(data);
      dataCache.current.set(cacheKey, data);
    } catch (err) {
      console.error("Error fetching deductions:", err);
      setError(err instanceof Error ? err.message : "Failed to load deductions");
      toast.error("Failed to load deductions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session, selectedMonth, selectedYear, selectedTypeId, cacheKey]);

  // Initial data fetch
  useEffect(() => {
    fetchReferenceData();
    fetchDeductionTypes();
  }, [fetchReferenceData, fetchDeductionTypes]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const handleRefresh = () => {
    dataCache.current.clear();
    fetchData(true);
    toast.info("Data refreshed");
  };

  const handleMonthChange = (delta: number) => {
    const monthIndex = MONTHS.indexOf(selectedMonth);
    let newYear = selectedYear;
    let newMonthIndex = monthIndex + delta;
    
    if (newMonthIndex < 0) {
      newMonthIndex = 11;
      newYear--;
    } else if (newMonthIndex > 11) {
      newMonthIndex = 0;
      newYear++;
    }
    
    setSelectedMonth(MONTHS[newMonthIndex]);
    setSelectedYear(newYear);
  };

  const handleExport = async () => {
    if (!companyId || !session) return;
    
    try {
      let url = `${API_BASE_URL}/company/${companyId}/deductions/export?month=${encodeURIComponent(selectedMonth)}&year=${selectedYear}`;
      if (selectedTypeId !== "all") {
        url += `&deduction_type_id=${selectedTypeId}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Deductions_${selectedMonth}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("Export started");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data");
    }
  };

  const handleAddSuccess = () => {
    dataCache.current.clear();
    fetchData(true);
    setIsAddDialogOpen(false);
    toast.success("Deduction assigned successfully");
  };

  const handleEdit = (deduction: AssignedDeduction) => {
    setSelectedDeduction(deduction);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (deduction: AssignedDeduction) => {
    setSelectedDeduction(deduction);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = (deductionIds: string[]) => {
    setDeductionsToDelete(deductionIds);
    setIsBulkDeleteDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    dataCache.current.clear();
    fetchData(true);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const handleBulkDeleteSuccess = () => {
    dataCache.current.clear();
    fetchData(true);
    setIsBulkDeleteDialogOpen(false);
    setDeductionsToDelete([]);
  };

  const handleImportClick = () => {
    setIsImportPreviewOpen(true);
  };

  // Sync external search with table filter
  useEffect(() => {
    setGlobalFilter(searchValue);
  }, [searchValue]);

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header with Month Navigation */}
      <div className="shrink-0 flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMonthChange(-1)}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Previous month</TooltipContent>
            </Tooltip>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {selectedMonth} {selectedYear}
              </span>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMonthChange(1)}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Next month</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Deduction Type Filter */}
          <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
            <SelectTrigger className="h-8 w-48 text-sm border-slate-200">
              <SelectValue placeholder="All deduction types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All deduction types</SelectItem>
              {deductionTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          {/* Search with toggle */}
          <div className="relative">
            {showSearch ? (
              <div className="relative animate-in slide-in-from-left-2 fade-in duration-200">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search by employee, deduction type..."
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
                <TooltipContent side="bottom">Search</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Refresh Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="h-8 w-8 p-0 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Refresh data</TooltipContent>
          </Tooltip>

          {/* Export Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="h-8 w-8 p-0 cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Export to Excel</TooltipContent>
          </Tooltip>

          {/* Import Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImportClick}
                className="h-8 w-8 p-0 cursor-pointer"
              >
                <CloudUpload className="h-4 w-4 text-slate-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Bulk import</TooltipContent>
          </Tooltip>

          {/* History Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/company/${companyId}/payroll/deductions/history`)}
                className="h-8 w-8 p-0 cursor-pointer"
              >
                <History className="h-4 w-4 text-slate-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">View history</TooltipContent>
          </Tooltip>

          {/* Add Button */}
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
            className="ml-2 h-8 text-xs rounded-sm cursor-pointer bg-[#7F5EFD] hover:bg-[#6a4ad3] shadow-none"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Assign
          </Button>
        </div>
      </div>

      {/* Counter */}
      <div className="shrink-0 py-2">
        <p className="text-xs text-slate-400">
          {deductions.length} deduction{deductions.length !== 1 ? 's' : ''} for {selectedMonth} {selectedYear}
        </p>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-hidden mt-2">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-slate-500 mt-2">Loading deductions...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : (
          <DeductionAssignTable
            data={deductions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            globalSearchValue={globalFilter}
            hideHeader={true}
          />
        )}
      </div>

      {/* Dialogs */}
      {isAddDialogOpen && (
        <AddDeductionDialog
          companyId={companyId!}
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onUpdated={handleAddSuccess}
          employees={employees}
          deductionTypes={deductionTypes}
          departments={departments}
          subDepartments={subDepartments}
          jobTitles={jobTitles}
        />
      )}

      {isEditDialogOpen && selectedDeduction && (
        <EditDeductionDialog
          deduction={selectedDeduction}
          companyId={companyId!}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onUpdated={handleUpdateSuccess}
        />
      )}

      {isDeleteDialogOpen && selectedDeduction && (
        <DeleteDeductionDialog
          deduction={selectedDeduction}
          companyId={companyId!}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={handleUpdateSuccess}
        />
      )}

      {isBulkDeleteDialogOpen && deductionsToDelete.length > 0 && (
        <BulkDeleteDeductionDialog
          companyId={companyId!}
          deductionIds={deductionsToDelete}
          isOpen={isBulkDeleteDialogOpen}
          onClose={() => {
            setIsBulkDeleteDialogOpen(false);
            setDeductionsToDelete([]);
          }}
          onDeleted={handleBulkDeleteSuccess}
        />
      )}

      {isImportPreviewOpen && (
        <ImportDeductionPreviewDialog
          companyId={companyId!}
          isOpen={isImportPreviewOpen}
          onClose={() => {
            setIsImportPreviewOpen(false);
          }}
          onSuccess={() => {
            dataCache.current.clear();
            fetchData(true);
          }}
        />
      )}
    </div>
  );
}