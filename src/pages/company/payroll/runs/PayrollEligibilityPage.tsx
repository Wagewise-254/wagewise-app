// src/pages/company/payroll/PayrollEligibilityPage.tsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Search,
  Edit2,
  Calendar,
  DollarSign,
  X,
  Filter,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  department?: string;
  job_title?: string;
  salary: number;
  hire_date: string;
  employee_status: string;
  payment_method?: string;
  eligibility_reason: string;
  eligibility_details: {
    hire_date: string;
    contract_start_date: string | null;
    contract_end_date: string | null;
    status_effective_date: string | null;
    current_status: string;
    is_eligible: boolean;
  };
  is_eligible: boolean;
}

interface Override {
  employee_id: string;
  is_eligible: boolean;
  original_reason: string;
  override_reason: string;
  eligibility_details: Employee["eligibility_details"];
}

type TabType = "eligible" | "ineligible" | "overridden";

export default function PayrollEligibilityPage() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();

  const month = searchParams.get("month") || format(new Date(), "MMMM");
  const year = parseInt(searchParams.get("year") || format(new Date(), "yyyy"));
  const editModeParam = searchParams.get("editMode");
  const isEditModeParam = editModeParam === "true";

  // State
  const [editMode, setEditMode] = useState(isEditModeParam);
  const [isUnconfirming, setIsUnconfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [overrides, setOverrides] = useState<Map<string, Override>>(new Map());
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("eligible");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);
  const [runStatus, setRunStatus] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

  // Override dialog
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [selectedEmployeeForOverride, setSelectedEmployeeForOverride] =
    useState<Employee | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [bulkOverrideType, setBulkOverrideType] = useState<
    "include" | "exclude" | null
  >(null);

  // Payroll run state
  const [payrollRunId, setPayrollRunId] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  // Fetch data - use different endpoint based on edit mode
  const fetchEligibility = useCallback(async () => {
    setLoading(true);
    try {
      // Use the edit endpoint if in edit mode, otherwise regular endpoint
      const endpoint = editMode
        ? `${API_BASE_URL}/company/${companyId}/payroll/eligibility/edit?month=${month}&year=${year}&editMode=true`
        : `${API_BASE_URL}/company/${companyId}/payroll/eligibility?month=${month}&year=${year}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const allEmployees = [
          ...(data.eligible_employees || []),
          ...(data.ineligible_employees || []),
        ];
        setEmployees(allEmployees);

        const uniqueDepts = [
          ...new Set(allEmployees.map((emp) => emp.department).filter(Boolean)),
        ] as string[];
        setDepartments(uniqueDepts);

        if (data.existing_run) {
          setPayrollRunId(data.existing_run.id);
          setRunStatus(data.existing_run.status || "");

          // Only show confirmed if NOT in edit mode and actually confirmed
          if (!editMode && data.existing_run.is_confirmed) {
            setIsConfirmed(true);
          } else {
            setIsConfirmed(false);
          }

          setCanEdit(data.existing_run.can_edit || editMode);
        } else {
        // NEW: For first-time payroll run (no existing run)
        // Allow editing by default
        setPayrollRunId(null);
        setRunStatus("");
        setIsConfirmed(false);
        setCanEdit(true); // This enables the Confirm & Process button
      }

        const overrideMap = new Map();
        if (data.overrides && Array.isArray(data.overrides)) {
          data.overrides.forEach((override: Override) => {
            overrideMap.set(override.employee_id, override);
          });
        }
        setOverrides(overrideMap);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to load eligibility data");
      }
    } catch (error) {
      console.error("Error fetching eligibility:", error);
      toast.error("Failed to load employee eligibility data");
    } finally {
      setLoading(false);
    }
  }, [companyId, month, year, session?.access_token, editMode]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  // Add function to unconfirm and enable editing
  const handleEnableEditing = async () => {
    if (!payrollRunId) return;

    // Check if run status allows editing
    if (["APPROVED", "LOCKED", "PAID"].includes(runStatus)) {
      toast.error(`Cannot edit payroll with status: ${runStatus}`);
      return;
    }

    setIsUnconfirming(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/eligibility/unconfirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            payrollRunId,
            reason: "Manual edit requested by user",
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enable editing");
      }

      toast.success(
        "Editing mode enabled. You can now modify employee eligibility.",
      );
      setEditMode(true);
      setIsConfirmed(false);
      await fetchEligibility(); // Refresh data
    } catch (error: unknown) {
      console.error("Error enabling edit:", error);
      toast.error((error as Error).message || "Failed to enable editing mode");
    } finally {
      setIsUnconfirming(false);
    }
  };

  // Helper functions
  const getEffectiveEligibility = useCallback(
    (employee: Employee): boolean => {
      const override = overrides.get(employee.id);
      return override ? override.is_eligible : employee.is_eligible;
    },
    [overrides],
  );

  const getEligibilityReason = useCallback(
    (employee: Employee): string => {
      const override = overrides.get(employee.id);
      if (override) {
        return `OVERRIDDEN: ${override.override_reason}`;
      }
      return employee.eligibility_reason;
    },
    [overrides],
  );

  const isOverridden = useCallback(
    (employeeId: string): boolean => {
      return overrides.has(employeeId);
    },
    [overrides],
  );

  // Filtered employees based on active tab
  const filteredByTab = useMemo(() => {
    return employees.filter((emp) => {
      const isEligible = getEffectiveEligibility(emp);
      const overridden = isOverridden(emp.id);

      if (activeTab === "eligible") return isEligible && !overridden;
      if (activeTab === "ineligible") return !isEligible && !overridden;
      if (activeTab === "overridden") return overridden;
      return true;
    });
  }, [employees, activeTab, getEffectiveEligibility, isOverridden]);

  // Search and department filter
  const filteredEmployees = useMemo(() => {
    let filtered = [...filteredByTab];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(term) ||
          emp.employee_number.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term),
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }

    return filtered;
  }, [filteredByTab, searchTerm, departmentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, departmentFilter]);

  // Selection handling
  const handleSelectAll = () => {
    if (selectedEmployees.size === paginatedEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(paginatedEmployees.map((e) => e.id)));
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  // Clear all overrides
  const handleResetAllOverrides = () => {
    if (overrides.size === 0) return;

    if (
      confirm(
        `This will remove all ${overrides.size} override(s) and reset to original eligibility. Continue?`,
      )
    ) {
      setOverrides(new Map());
      setSelectedEmployees(new Set());
      toast.success("All overrides have been removed");
    }
  };

  // Revert a specific employee to original
  const handleRevertToOriginal = (employee: Employee) => {
    if (overrides.has(employee.id)) {
      const newOverrides = new Map(overrides);
      newOverrides.delete(employee.id);
      setOverrides(newOverrides);
      toast.success(
        `Reverted ${employee.first_name} ${employee.last_name} to original eligibility`,
      );
    }
  };

  // Override handlers
  const handleSingleOverride = (employee: Employee) => {
    if (!editMode && !canEdit) {
      toast.error("Editing is disabled. Please enable edit mode first.");
      return;
    }
    setSelectedEmployeeForOverride(employee);
    setOverrideReason("");
    setIsOverrideDialogOpen(true);
  };

  const handleBulkOverride = (type: "include" | "exclude") => {
    if (!editMode && !canEdit) {
      toast.error("Editing is disabled. Please enable edit mode first.");
      return;
    }
    if (selectedEmployees.size === 0) {
      toast.error("Please select employees first");
      return;
    }
    setBulkOverrideType(type);
    setOverrideReason("");
    setIsOverrideDialogOpen(true);
  };

  const saveOverride = async () => {
    if (!selectedEmployeeForOverride && !bulkOverrideType) return;

    const newOverrides = new Map(overrides);

    if (selectedEmployeeForOverride) {
      const newEligibility = !getEffectiveEligibility(
        selectedEmployeeForOverride,
      );
      const originalEligibility = selectedEmployeeForOverride.is_eligible;

      if (newEligibility === originalEligibility) {
        newOverrides.delete(selectedEmployeeForOverride.id);
        toast.success("Override removed. Using original eligibility.");
      } else {
        newOverrides.set(selectedEmployeeForOverride.id, {
          employee_id: selectedEmployeeForOverride.id,
          is_eligible: newEligibility,
          original_reason: selectedEmployeeForOverride.eligibility_reason,
          override_reason: overrideReason || "Manual override",
          eligibility_details: selectedEmployeeForOverride.eligibility_details,
        });
        toast.success(
          `Override applied: Employee will be ${newEligibility ? "included in" : "excluded from"} payroll`,
        );
      }
    } else if (bulkOverrideType && selectedEmployees.size > 0) {
      let changedCount = 0;
      selectedEmployees.forEach((employeeId) => {
        const employee = employees.find((e) => e.id === employeeId);
        if (employee) {
          const newEligibility = bulkOverrideType === "include";
          const currentEligibility = getEffectiveEligibility(employee);

          if (currentEligibility !== newEligibility) {
            newOverrides.set(employeeId, {
              employee_id: employeeId,
              is_eligible: newEligibility,
              original_reason: employee.eligibility_reason,
              override_reason:
                overrideReason || `Bulk ${bulkOverrideType} override`,
              eligibility_details: employee.eligibility_details,
            });
            changedCount++;
          }
        }
      });

      if (changedCount === 0) {
        toast.info("Selected employees already have this eligibility status");
      } else {
        toast.success(`${changedCount} employee(s) updated successfully`);
      }
    }

    setOverrides(newOverrides);
    setIsOverrideDialogOpen(false);
    setSelectedEmployeeForOverride(null);
    setSelectedEmployees(new Set());
    setBulkOverrideType(null);
  };

  // Confirm handler
  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const overrideArray = Array.from(overrides.values());

      const saveResponse = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/eligibility/overrides`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            month,
            year,
            overrides: overrideArray,
            forceUpdate: editMode, // Add this flag
          }),
        },
      );

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.error || "Failed to save overrides");
      }

      const saveData = await saveResponse.json();
      const runId = saveData.payroll_run_id;

      // If we're in edit mode, we DON'T want to reconfirm eligibility
      // Just navigate to process payroll
      if (editMode) {
        toast.success("Changes saved successfully!");
        navigate(
          `/company/${companyId}/payroll/process/${runId}?month=${month}&year=${year}`,
        );
        return;
      }

      // Only confirm if NOT in edit mode
      const confirmResponse = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/eligibility/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            payrollRunId: runId,
            notes: `Confirmed on ${new Date().toLocaleString()}`,
          }),
        },
      );

      if (!confirmResponse.ok) {
        const error = await confirmResponse.json();
        throw new Error(error.error || "Failed to confirm eligibility");
      }

      toast.success("Employee eligibility confirmed!");
      navigate(
        `/company/${companyId}/payroll/process/${runId}?month=${month}&year=${year}`,
      );
    } catch (error: unknown) {
      console.error("Error confirming:", error);
      toast.error(
        (error as Error).message || "Failed to confirm payroll eligibility",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab configuration
  const tabs = [
    { key: "eligible" as TabType, label: "Eligible" },
    { key: "ineligible" as TabType, label: "Ineligible" },
    { key: "overridden" as TabType, label: "Overridden" },
  ];

  // Pagination render
  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => setCurrentPage(i)}
              className="cursor-pointer h-8 w-8"
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="cursor-pointer h-8 w-8"
          >
            1
          </PaginationLink>
        </PaginationItem>,
      );

      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="ellipsis-1" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => setCurrentPage(i)}
              className="cursor-pointer h-8 w-8"
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="ellipsis-2" />);
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="cursor-pointer h-8 w-8"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Show confirmed state only when NOT in edit mode AND isConfirmed is true
  if (isConfirmed && !editMode) {
    return (
      <Card className="rounded-sm border-slate-200 bg-white">
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Payroll Eligibility Confirmed
          </h2>
          <p className="text-slate-600 mb-6">
            Employee list has been locked for {month} {year}.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(`/company/${companyId}/payroll/run`)}
            >
              Back to Payroll
            </Button>
            <Button
              onClick={() =>
                navigate(
                  `/company/${companyId}/payroll/process/${payrollRunId}?month=${month}&year=${year}`,
                )
              }
              className="bg-green-600 hover:bg-green-700"
            >
              Process Payroll
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show warning if run status is locked
  const isRunLocked = ["APPROVED", "LOCKED", "PAID"].includes(runStatus);
  const canEditRun = (editMode || canEdit) && !isRunLocked;

  const selectedCount = selectedEmployees.size;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Payroll Eligibility
            {editMode && (
              <Badge
                variant="outline"
                className="ml-2 text-amber-600 border-amber-300 bg-amber-50"
              >
                Edit Mode
              </Badge>
            )}
            {isRunLocked && (
              <Badge
                variant="outline"
                className="ml-2 text-red-600 border-red-300 bg-red-50"
              >
                Locked
              </Badge>
            )}
          </h1>
          <p className="text-sm text-slate-500">
            {month} {year}
            {runStatus && ` • Status: ${runStatus}`}
          </p>
        </div>
        <div className="flex gap-2">
          {isConfirmed && !editMode && !isRunLocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableEditing}
              disabled={isUnconfirming}
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
            >
              {isUnconfirming && (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              )}
              <Edit2 className="mr-2 h-3 w-3" />
              Enable Editing
            </Button>
          )}
          {isRunLocked && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Payroll is {runStatus.toLowerCase()}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/company/${companyId}/payroll/run`)}
          >
            Cancel
          </Button>
          {canEditRun && (
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              )}
              {editMode ? "Save Changes & Process" : "Confirm & Process"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <Card className="rounded-sm border-slate-200 bg-white shadow-none px-2">
        <CardContent className="p-0">
          {/* Tabs */}
          <div className="border-b border-slate-200 px-4 pt-4">
            <nav className="flex gap-6">
              {tabs.map((tab) => {
                const count =
                  tab.key === "eligible"
                    ? employees.filter(
                        (e) =>
                          getEffectiveEligibility(e) && !isOverridden(e.id),
                      ).length
                    : tab.key === "ineligible"
                      ? employees.filter(
                          (e) =>
                            !getEffectiveEligibility(e) && !isOverridden(e.id),
                        ).length
                      : overrides.size;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "relative pb-2 text-sm font-medium transition-colors",
                      activeTab === tab.key
                        ? "text-slate-900"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    {tab.label}
                    <Badge
                      variant="secondary"
                      className="ml-2 text-xs h-5 px-1.5 bg-slate-100 text-slate-600"
                    >
                      {count}
                    </Badge>
                    {activeTab === tab.key && (
                      <span className="absolute left-0 -bottom-px h-0.5 w-full bg-slate-900" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Override Banner */}
          {overrides.size > 0 && (
            <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    {overrides.size} employee(s) have been manually overridden
                  </span>
                </div>
                {canEditRun && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetAllOverrides}
                    className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                  >
                    Reset all
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {/* Bulk Actions */}
              {selectedCount > 0 && canEditRun && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1">
                  <span className="text-xs text-slate-500">
                    {selectedCount} selected
                  </span>
                  {activeTab === "eligible" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 rounded-sm"
                      onClick={() => handleBulkOverride("exclude")}
                    >
                      Remove from Payroll
                    </Button>
                  )}
                  {activeTab === "ineligible" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-green-200 text-green-600 hover:bg-green-50 rounded-sm cursor-pointer"
                      onClick={() => handleBulkOverride("include")}
                    >
                      Add to Payroll
                    </Button>
                  )}
                  {activeTab === "overridden" && selectedCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-amber-200 text-amber-600 hover:bg-amber-50 rounded-sm"
                      onClick={() => {
                        if (
                          confirm(
                            `Remove overrides for ${selectedCount} selected employee(s)?`,
                          )
                        ) {
                          const newOverrides = new Map(overrides);
                          selectedEmployees.forEach((id) => {
                            newOverrides.delete(id);
                          });
                          setOverrides(newOverrides);
                          setSelectedEmployees(new Set());
                          toast.success(
                            `Removed overrides for ${selectedCount} employee(s)`,
                          );
                        }
                      }}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Revert Selected
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                {showSearch ? (
                  <div className="relative animate-in slide-in-from-left-2 fade-in duration-200">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onBlur={() => {
                        if (!searchTerm) setShowSearch(false);
                      }}
                      className="pl-8 h-8 w-64 text-sm bg-white border-slate-200 rounded-sm"
                      autoFocus
                    />
                  </div>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSearch(true)}
                          className="h-8 w-8 p-0"
                        >
                          <Search className="h-4 w-4 text-slate-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Search employees
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Department Filter */}
              {departments.length > 0 && (
                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger className="h-8 w-40 text-xs border-slate-200 rounded-sm">
                    <Filter className="h-3 w-3 mr-2 text-slate-400" />
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 border-b border-slate-200">
                  <TableHead className="w-10">
                    {canEditRun && (
                      <Checkbox
                        checked={
                          selectedCount === paginatedEmployees.length &&
                          paginatedEmployees.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                        className="shadow-none border-slate-400 rounded-sm"
                      />
                    )}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Employee
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Department
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Job Title
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Salary
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 w-50 min-w-37.5 max-w-62.5">
                    Reason
                  </TableHead>
                  <TableHead className="w-16 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((employee) => {
                  const reason = getEligibilityReason(employee);
                  const overridden = isOverridden(employee.id);

                  return (
                    <TableRow
                      key={employee.id}
                      className={cn(
                        overridden && "bg-amber-50/30",
                        "border-b border-slate-100",
                      )}
                    >
                      <TableCell>
                        {canEditRun && (
                          <Checkbox
                            checked={selectedEmployees.has(employee.id)}
                            onCheckedChange={() =>
                              handleSelectEmployee(employee.id)
                            }
                            className="shadow-none border-slate-400 rounded-sm"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm text-slate-900">
                            {employee.first_name} {employee.middle_name}{" "}
                            {employee.last_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {employee.employee_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {employee.department || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {employee.job_title || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-900">
                        KES {employee.salary?.toLocaleString() || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs rounded-sm",
                            employee.employee_status === "ACTIVE" &&
                              "bg-green-50 text-green-700 border-green-200",
                            employee.employee_status === "ON LEAVE" &&
                              "bg-amber-50 text-amber-700 border-amber-200",
                            employee.employee_status === "TERMINATED" &&
                              "bg-rose-50 text-rose-700 border-rose-200",
                          )}
                        >
                          {employee.employee_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-62.5 w-50">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-xs text-slate-500 truncate cursor-help">
                                {reason.includes("OVERRIDDEN") ? (
                                  <Edit2 className="h-3 w-3 text-amber-500 shrink-0" />
                                ) : reason.includes("Hired on") ? (
                                  <Calendar className="h-3 w-3 shrink-0" />
                                ) : reason.includes("salary") ? (
                                  <DollarSign className="h-3 w-3 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                )}
                                <span className="truncate">{reason}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md">
                              <p className="text-xs">{reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="w-16 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canEditRun && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSingleOverride(employee)}
                                className="h-7 w-7 p-0"
                                title="Override eligibility"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                              </Button>
                              {overridden && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRevertToOriginal(employee)
                                  }
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Remove override"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paginatedEmployees.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-slate-400"
                    >
                      No employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredEmployees.length)} of{" "}
                {filteredEmployees.length}
              </div>
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={cn(
                        "h-7 w-7 p-0",
                        currentPage === 1 && "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={cn(
                        "h-7 w-7 p-0",
                        currentPage === totalPages &&
                          "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog
        open={isOverrideDialogOpen}
        onOpenChange={setIsOverrideDialogOpen}
      >
        <DialogContent className="sm:max-w-md rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {selectedEmployeeForOverride
                ? "Override Eligibility"
                : bulkOverrideType === "include"
                  ? `Add ${selectedEmployees.size} Employee(s) to Payroll`
                  : `Remove ${selectedEmployees.size} Employee(s) from Payroll`}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {selectedEmployeeForOverride
                ? selectedEmployeeForOverride.is_eligible
                  ? "This will exclude them from this payroll cycle."
                  : "This will include them in this payroll cycle."
                : `Please provide a reason for this change.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedEmployeeForOverride && (
              <div className="bg-slate-50 p-3 rounded-sm">
                <p className="text-sm font-medium text-slate-900">
                  {selectedEmployeeForOverride.first_name}{" "}
                  {selectedEmployeeForOverride.last_name}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedEmployeeForOverride.employee_number}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  {selectedEmployeeForOverride.eligibility_reason}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">
                Reason
              </label>
              <Textarea
                placeholder="Why are you making this change?"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
                className="mt-1 rounded-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOverrideDialogOpen(false)}
              className="rounded-sm"
            >
              Cancel
            </Button>
            <Button onClick={saveOverride} className="rounded-sm">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
