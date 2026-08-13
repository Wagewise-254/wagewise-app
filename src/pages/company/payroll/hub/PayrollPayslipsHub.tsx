// src/pages/company/payroll/PayrollPayslips.tsx

import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Mail,
  Eye,
  Download,
  RefreshCw,
  FileText,
  Rows,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Users,
  CheckCircle,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  usePayrollDetails,
  useReviewStatus,
} from "@/pages/company/payroll/reviews/hooks/usePayrollReview";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePayslipOperations } from "@/hooks/usePayslipOperations";
import { payslipService } from "@/services/payslipService";

interface PayslipEmployee {
  id: string;
  employee_name: string;
  employee_number: string;
  email: string;
  job_title: string | null;
  department_name: string | null;
  net_pay: number;
  payslip_generated_at: string | null;
  payslip_sent_at: string | null;
  payslip_viewed_at: string | null;
  review_status: string;
}

type LayoutOption = "single" | "duplicate" | "two-up";
type EmailStatus = "idle" | "sending" | "complete" | "failed";
type EmailLogEntry = {
  employeeId: string;
  employeeName: string;
  email: string;
  status: "success" | "failed" | "pending";
  error?: string;
  timestamp: string;
};

const getStatusBadge = (status: string) => {
  const statusMap: Record<
    string,
    { bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    APPROVED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    PENDING: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: <Clock className="h-3 w-3" />,
    },
    REJECTED: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  return statusMap[status] || statusMap.PENDING;
};

// Email Progress Dialog Component
const EmailProgressDialog = ({
  open,
  onOpenChange,
  logs,
  status,
  totalCount,
  completedCount,
  failedCount,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: EmailLogEntry[];
  status: EmailStatus;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  onClose: () => void;
}) => {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getStatusIcon = (logStatus: string) => {
    switch (logStatus) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[#7F5EFD]" />
            Sending Payslips
          </DialogTitle>
          <DialogDescription>
            {status === "sending" && "Sending payslips to employees..."}
            {status === "complete" && "All payslips sent successfully!"}
            {status === "failed" && "Some payslips failed to send"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-3">
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-lg font-semibold text-slate-900">
                  {totalCount}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-3">
                <p className="text-xs text-emerald-600">Sent</p>
                <p className="text-lg font-semibold text-emerald-700">
                  {completedCount}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3">
                <p className="text-xs text-red-600">Failed</p>
                <p className="text-lg font-semibold text-red-700">
                  {failedCount}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-slate-500 text-right">
              {Math.round(progress)}% complete
            </p>
          </div>

          <div className="flex-1 min-h-0">
            <p className="text-xs font-medium text-slate-600 mb-2">
              Delivery Log
            </p>
            <ScrollArea className="h-50 border rounded-md p-2 bg-slate-50/50">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 py-1.5 px-2 hover:bg-slate-100 rounded-sm transition-colors"
                >
                  {getStatusIcon(log.status)}
                  <span className="text-sm text-slate-700 flex-1">
                    {log.employeeName}
                  </span>
                  <span className="text-xs text-slate-400">{log.email}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      log.status === "success" &&
                        "border-emerald-200 text-emerald-700 bg-emerald-50",
                      log.status === "failed" &&
                        "border-red-200 text-red-700 bg-red-50",
                      log.status === "pending" &&
                        "border-amber-200 text-amber-700 bg-amber-50",
                    )}
                  >
                    {log.status}
                  </Badge>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={status === "sending"}
          >
            Close
          </Button>
          {status === "failed" && (
            <Button
              className="bg-[#7F5EFD] hover:bg-[#6a4ad3] text-white"
              onClick={() => {
                toast.info("Retrying failed sends...");
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Failed
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Simple Layout Selection Dialog
const LayoutDialog = ({
  open,
  onOpenChange,
  onConfirm,
  selectedCount,
  isSingleEmployee,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (layout: LayoutOption) => void;
  selectedCount: number;
  isSingleEmployee: boolean;
  isLoading?: boolean;
}) => {
  const [selectedLayout, setSelectedLayout] = useState<LayoutOption>("single");

  const getLayoutOptions = () => {
    if (isSingleEmployee) {
      return [
        {
          value: "single" as LayoutOption,
          label: "Single Payslip",
          icon: <FileText className="h-5 w-5" />,
          description: "One payslip per page (A5)",
        },
        {
          value: "duplicate" as LayoutOption,
          label: "Duplicate",
          icon: <Copy className="h-5 w-5" />,
          description: "Two copies of same payslip per page (A4)",
        },
      ];
    } else {
      return [
        {
          value: "single" as LayoutOption,
          label: "Single per page",
          icon: <FileText className="h-5 w-5" />,
          description: `${selectedCount} pages, one payslip each`,
        },
        {
          value: "duplicate" as LayoutOption,
          label: "Duplicate each",
          icon: <Copy className="h-5 w-5" />,
          description: `${selectedCount} pages, two copies each`,
        },
        {
          value: "two-up" as LayoutOption,
          label: "Two per page",
          icon: <Rows className="h-5 w-5" />,
          description: `${Math.ceil(selectedCount / 2)} pages, side by side`,
        },
      ];
    }
  };

  const layoutOptions = getLayoutOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payslip Layout</DialogTitle>
          <DialogDescription>
            {isSingleEmployee
              ? "Select how you want to display the payslip"
              : `Select how you want to display ${selectedCount} payslips`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {layoutOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedLayout(option.value)}
              disabled={isLoading}
              className={cn(
                "flex flex-col items-center gap-2 p-4 border rounded-sm transition-all",
                selectedLayout === option.value
                  ? "border-[#7F5EFD] bg-[#7F5EFD]/5 ring-1 ring-[#7F5EFD]"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                isLoading && "opacity-50 cursor-not-allowed",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-sm",
                  selectedLayout === option.value
                    ? "text-[#7F5EFD]"
                    : "text-slate-400",
                )}
              >
                {option.icon}
              </div>
              <span className="text-sm font-medium text-slate-900">
                {option.label}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {option.description}
              </span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedLayout)}
            className="bg-[#7F5EFD] hover:bg-[#6a4ad3] text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function PayrollPayslipsHub() {
  const { companyId, payrollRunId } = useParams<{
    companyId: string;
    payrollRunId: string;
  }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<LayoutOption>("single");
  const [pendingAction, setPendingAction] = useState<
    "preview" | "download" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Use our custom hook
  const {
    isLoading: isActionLoading,
    isSendingEmail,
    emailStatus,
    emailLogs,
    emailTotal,
    emailCompleted,
    emailFailed,
    sendMultiplePayslipEmails,
    sendPayslipEmail,
    markMultipleAsSent,
    resetEmailState,
  } = usePayslipOperations({
    companyId: companyId!,
    payrollRunId: payrollRunId!,
    onSuccess: () => {
      refetchDetails();
    },
    onError: (error) => {
      console.error("Payslip operation failed:", error);
    },
  });

  // Use existing hooks
  const { data: reviewStatus, isLoading: statusLoading } = useReviewStatus(
    companyId!,
    payrollRunId!,
  );

  const {
    data: payrollDetails,
    isLoading: detailsLoading,
    refetch: refetchDetails,
  } = usePayrollDetails(companyId!, payrollRunId!);

  const payroll = reviewStatus?.payroll;

  // Transform data for payslip view
  const employees = (payrollDetails || [])
    .filter((emp) => emp.is_eligible)
    .map(
      (emp): PayslipEmployee => ({
        id: emp.id,
        employee_name: emp.employee_name,
        employee_number: emp.employee_number,
        email: emp.employee?.email || "",
        job_title: emp.job_title,
        department_name: emp.department_name,
        net_pay: emp.net_pay || 0,
        payslip_generated_at: emp.payslip_generated_at || null,
        payslip_sent_at: emp.payslip_sent_at || null,
        payslip_viewed_at: emp.payslip_viewed_at || null,
        review_status: emp.my_review?.status || "PENDING",
      }),
    );

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    return (
      emp.employee_name?.toLowerCase().includes(query) ||
      emp.employee_number?.toLowerCase().includes(query) ||
      emp.job_title?.toLowerCase().includes(query) ||
      emp.department_name?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredEmployees.length,
  );
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Get selected employees
  const selectedEmployees = useMemo(() => {
    return employees.filter((emp) => selectedIds.has(emp.id));
  }, [employees, selectedIds]);

  const isSingleEmployee = selectedEmployees.length === 1;
  const hasSelected = selectedIds.size > 0;

  const handleBack = () => {
    navigate(-1);
  };

  const handleRefresh = async () => {
    await refetchDetails();
    toast.info("Refreshing payslip data...");
  };

  const handleSelectAll = () => {
    if (selectedIds.size === currentEmployees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentEmployees.map((e) => e.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleAction = (action: "preview" | "download") => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one employee using checkboxes");
      return;
    }
    setPendingAction(action);
    setLayoutDialogOpen(true);
  };

  // Add this function after handleAction
  // Replace the handleSingleAction function
const handleSingleAction = (action: "preview" | "download" | "email" | "markSent", employeeId: string) => {
  // Set the single employee as selected
  setSelectedIds(new Set([employeeId]));
  
  if (action === "preview" || action === "download") {
    setPendingAction(action);
    setLayoutDialogOpen(true);
  } else if (action === "email") {
    // Show loading toast
    const loadingToast = toast.loading("Sending payslip...");
    handleSingleSendEmail(employeeId, loadingToast);
  } else if (action === "markSent") {
    // Show loading toast
    const loadingToast = toast.loading("Marking payslip as sent...");
    handleSingleMarkAsSent(loadingToast);
  }
};

  // Update the handleLayoutConfirm function
  const handleLayoutConfirm = async (layout: LayoutOption) => {
    setLayoutDialogOpen(false);
    setSelectedLayout(layout);
    console.log(selectedLayout)
    setIsProcessing(true);

    const employeeIds = Array.from(selectedIds);

    try {
      // Map frontend layout to backend format
      let backendLayout: "single" | "two-up" | "grid" | "duplicate";
      let duplicate = false;

      if (layout === "single") {
        backendLayout = "single";
        duplicate = false;
      } else if (layout === "duplicate") {
        backendLayout = "duplicate";
        duplicate = true;
      } else if (layout === "two-up") {
        backendLayout = "two-up";
        duplicate = false;
      } else {
        backendLayout = "single"; // Fallback
        duplicate = false;
      }

      const blob = await payslipService.downloadMultiplePayslips(companyId!, {
        employeeIds,
        layout: backendLayout,
        duplicate: duplicate,
      });

      if (pendingAction === "preview") {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        toast.success("Preview opened in new window");
      } else if (pendingAction === "download") {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        const fileName = `payslips_${new Date().toISOString().split("T")[0]}.pdf`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
        toast.success(`${employeeIds.length} payslips downloaded successfully`);
      }

      setSelectedIds(new Set());
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error(
        pendingAction === "preview"
          ? "Failed to generate preview"
          : "Failed to download payslips",
      );
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

// Replace the handleSendEmail function
const handleSendEmail = async () => {
  if (selectedIds.size === 0) {
    toast.error("Please select at least one employee");
    return;
  }

  const loadingToast = toast.loading(
    selectedIds.size === 1 ? "Sending payslip..." : `Sending ${selectedIds.size} payslips...`
  );

  try {
    await sendMultiplePayslipEmails(Array.from(selectedIds), "single");
    toast.dismiss(loadingToast);
    setEmailDialogOpen(true);
  } catch (error) {
    console.error("Email send failed:", error);
    toast.dismiss(loadingToast);
    toast.error("Failed to send payslips");
  }
};

  // Add this function after handleSingleAction
// Add this function
const handleSingleSendEmail = async (employeeId: string, loadingToast?: string | number) => {
  try {
    await sendPayslipEmail(employeeId);
    await refetchDetails();
    if (loadingToast) toast.dismiss(loadingToast);
    toast.success("Payslip sent successfully");
  } catch (error) {
    console.error("Email send failed:", error);
    if (loadingToast) toast.dismiss(loadingToast);
    toast.error("Failed to send payslip email");
  }
};

  const handleEmailClose = () => {
    setEmailDialogOpen(false);
    if (emailStatus === "complete" || emailStatus === "failed") {
      setSelectedIds(new Set());
    }
    setTimeout(() => {
      resetEmailState();
    }, 300);
  };

  // Add this function
const handleSingleMarkAsSent = async (loadingToast?: string | number) => {
  const employeeIds = Array.from(selectedIds);
  
  try {
    await markMultipleAsSent(employeeIds, payrollRunId!);
    setSelectedIds(new Set());
    await refetchDetails();
    if (loadingToast) toast.dismiss(loadingToast);
    toast.success("Payslip marked as sent successfully");
  } catch (error) {
    console.error("Failed to mark as sent:", error);
    if (loadingToast) toast.dismiss(loadingToast);
    toast.error("Failed to mark payslip as sent");
  }
};

  const handleMarkAsSent = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    const loadingToast = toast.loading(
    selectedIds.size === 1 ? "Marking payslip as sent..." : `Marking ${selectedIds.size} payslips as sent...`
  );

    try {
    await markMultipleAsSent(Array.from(selectedIds), payrollRunId!);
    setSelectedIds(new Set());
    await refetchDetails();
    toast.dismiss(loadingToast);
    toast.success(
      selectedIds.size === 1 
        ? "Payslip marked as sent successfully" 
        : `${selectedIds.size} payslips marked as sent successfully`
    );
  } catch (error) {
    console.error("Failed to mark as sent:", error);
    toast.dismiss(loadingToast);
    toast.error("Failed to mark payslips as sent");
  }
  };

  const isAllSelected =
    currentEmployees.length > 0 && selectedIds.size === currentEmployees.length;

  const getPayslipStatus = (employee: PayslipEmployee) => {
    if (employee.payslip_sent_at) {
      return { label: "Sent", color: "text-emerald-600 bg-emerald-50" };
    }
    if (employee.payslip_generated_at) {
      return { label: "Generated", color: "text-amber-600 bg-amber-50" };
    }
    return { label: "Not sent", color: "text-slate-400 bg-slate-50" };
  };

  // Open email dialog when email status changes to complete or failed
  useEffect(() => {
    if (emailStatus === "complete" || emailStatus === "failed") {
      setEmailDialogOpen(true);
    }
  }, [emailStatus]);

  if (statusLoading || detailsLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <section className="h-full pb-4 bg-white border border-slate-200 rounded-md">
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
            </div>
          </div>
          <div className="px-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto">
        <section className="mx-8 h-full pb-4 bg-white">
          <header className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 w-8 p-0 hover:bg-slate-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    Payslips
                  </h1>
                  <p className="text-sm text-slate-400">
                    {payroll?.payroll_number} · {payroll?.payroll_month}{" "}
                    {payroll?.payroll_year}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {employees.length} employees
            </Badge>
          </header>

          <div className="flex items-center justify-between gap-3 px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                {showSearch ? (
                  <div className="relative animate-in slide-in-from-left-2 fade-in duration-200">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => {
                        if (!searchQuery) setShowSearch(false);
                      }}
                      className="pl-8 h-8 w-64 text-sm bg-white border-slate-200 rounded-sm focus-visible:ring-1 focus-visible:ring-[#7F5EFD]"
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

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Refresh</TooltipContent>
              </Tooltip>

              {hasSelected && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("preview")}
                        className="h-8 text-xs rounded-sm border-[#7F5EFD] text-[#7F5EFD] hover:bg-[#7F5EFD]/10"
                        disabled={isActionLoading || isProcessing}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Preview ({selectedIds.size})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Preview selected payslips
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("download")}
                        className="h-8 text-xs rounded-sm border-slate-200"
                        disabled={isActionLoading || isProcessing}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download ({selectedIds.size})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Download selected payslips
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendEmail}
                        className="h-8 text-xs rounded-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Send ({selectedIds.size})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Send selected payslips via email
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAsSent}
                        className="h-8 text-xs rounded-sm border-blue-200 text-blue-700 hover:bg-blue-50"
                        disabled={isActionLoading}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Mark Sent ({selectedIds.size})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Mark selected payslips as sent
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>

            {hasSelected && (
              <Badge
                variant="secondary"
                className="text-xs bg-[#7F5EFD]/10 text-[#7F5EFD]"
              >
                <Users className="h-3 w-3 mr-1" />
                {selectedIds.size} selected
              </Badge>
            )}
          </div>

          <div className="overflow-auto px-6">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50 border-slate-200">
                  <TableHead className="w-10 pl-5">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className="border-slate-500"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Employee
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Department
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                    Net Pay
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                    Payslip Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right pr-5">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentEmployees.map((employee) => {
                  const statusStyle = getStatusBadge(employee.review_status);
                  const payslipStatus = getPayslipStatus(employee);

                  return (
                    <TableRow
                      key={employee.id}
                      className="hover:bg-slate-50/70 border-slate-100"
                    >
                      <TableCell className="pl-5">
                        <Checkbox
                          checked={selectedIds.has(employee.id)}
                          onCheckedChange={() => handleSelectOne(employee.id)}
                          className="border-slate-500"
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {employee.employee_name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {employee.employee_number}
                            {employee.job_title && ` · ${employee.job_title}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {employee.department_name || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {employee.email || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            statusStyle.bg,
                            statusStyle.text,
                            statusStyle.border,
                            "border capitalize flex items-center gap-1 w-fit rounded-sm text-xs",
                          )}
                        >
                          {statusStyle.icon}
                          {employee.review_status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-slate-900 text-sm">
                          KES {employee.net_pay?.toLocaleString() || "0"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            payslipStatus.color,
                            "border-0 text-xs",
                          )}
                        >
                          {payslipStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                // Clear any checkbox selections first
                                setSelectedIds(new Set());
                                // Then handle single employee action
                                handleSingleAction("preview", employee.id);
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4 text-blue-600" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedIds(new Set());
                                handleSingleAction("download", employee.id);
                              }}
                              className="cursor-pointer"
                            >
                              <Download className="mr-2 h-4 w-4 text-slate-600" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedIds(new Set());
                                handleSingleAction("email", employee.id);
                              }}
                              className="cursor-pointer"
                            >
                              <Mail className="mr-2 h-4 w-4 text-emerald-600" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedIds(new Set());
                                handleSingleAction("markSent", employee.id);
                              }}
                              className="cursor-pointer"
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                              Mark as Sent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No employees found</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200">
              <p className="text-xs text-slate-400">
                Showing {startIndex + 1} to {endIndex} of{" "}
                {filteredEmployees.length}
              </p>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-slate-600 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Layout Selection Dialog */}
      <LayoutDialog
        open={layoutDialogOpen}
        onOpenChange={setLayoutDialogOpen}
        onConfirm={handleLayoutConfirm}
        selectedCount={selectedIds.size}
        isSingleEmployee={isSingleEmployee}
        isLoading={isProcessing}
      />

      {/* Email Progress Dialog */}
      <EmailProgressDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        logs={emailLogs}
        status={emailStatus}
        totalCount={emailTotal}
        completedCount={emailCompleted}
        failedCount={emailFailed}
        onClose={handleEmailClose}
      />
    </>
  );
}
