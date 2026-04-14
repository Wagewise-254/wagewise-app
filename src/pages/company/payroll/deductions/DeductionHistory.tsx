// pages/company/payroll/benefits/AllowanceHistory.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, Search, ArrowLeft, Calendar, Download } from "lucide-react";
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



export default function DeductionHistory() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [deductions, setDeductions] = useState<AssignedDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("all");
  const [deductionTypes, setDeductionTypes] = useState<Array<{id: string, name: string}>>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

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

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/company/${companyId}/deductions?page=${pagination.page}&limit=${pagination.limit}`;
      if (selectedTypeId !== "all") {
        url += `&deduction_type_id=${selectedTypeId}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch deductions");
      const data = await response.json();
      setDeductions(data.data || data);
      setPagination(prev => ({ ...prev, total: data.total || data.length }));
    } catch (err) {
      console.error("Error fetching deductions:", err);
      toast.error("Failed to load deduction history");
    } finally {
      setLoading(false);
    }
  }, [companyId, session, selectedTypeId, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchDeductionTypes();
  }, [fetchDeductionTypes  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setGlobalFilter(searchValue);
  }, [searchValue]);

  const handleExport = async () => {
    if (!companyId || !session) return;
    try {
      let url = `${API_BASE_URL}/company/${companyId}/deductions/export`;
      if (selectedTypeId !== "all") {
        url += `?deduction_type_id=${selectedTypeId}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Deduction_History_${new Date().toISOString().split("T")[0]}.xlsx`;
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

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/company/${companyId}/payroll/deductions/assign`)}
                className="h-8 w-8 p-0 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to monthly view</TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <h1 className="text-lg font-semibold text-slate-800">Deduction History</h1>
          </div>
          
          <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
            <SelectTrigger className="h-8 w-48 text-sm border-slate-200 ml-4">
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
          {/* Search */}
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

          {/* Export */}
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
            <TooltipContent side="bottom">Export all to Excel</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Counter */}
      <div className="shrink-0 py-2">
        <p className="text-xs text-slate-400">
          {deductions.length} total deduction{deductions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden mt-2">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-slate-500 mt-2">Loading history...</p>
          </div>
        ) : (
          <DeductionAssignTable
            data={deductions}
            onEdit={() => {}} // Read-only in history
            onDelete={() => {}}
            onBulkDelete={() => {}}
            globalSearchValue={globalFilter}
            hideHeader={true}
            readOnly={true}
          />
        )}
      </div>
    </div>
  );
}