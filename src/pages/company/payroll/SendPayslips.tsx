import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Mail,
  CalendarClock,
  ChevronDown,
  AlertCircle,
  ArrowLeft,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

type PayrollRun = {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
};

interface PayrollReportData {
  id: string;
  employeeId: string;
  fullName: string;
  jobTitle: string;
  department: string;
  email: string;
  reviewStatus: string;
}

const toProperCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const EmployeeStatusBadge = ({ status }: { status: string }) => {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5 mr-1" />;
      case "pending":
        return <Clock className="h-3.5 w-3.5 mr-1" />;
      case "rejected":
        return <XCircle className="h-3.5 w-3.5 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Badge variant="outline" className={`${getVariant(status)} font-medium flex items-center w-fit`}>
      {getIcon(status)}
      {toProperCase(status)}
    </Badge>
  );
};

export default function SendPayslip() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(true);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [data, setData] = useState<PayrollReportData[]>([]);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // Calculate selected items based on the selection state
  const selectedItems = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => data[Number(index)])
      .filter(Boolean);
  }, [rowSelection, data]);

  // Fetch all completed payroll runs for the company
  const fetchPayrollRuns = useCallback(async () => {
    if (!companyId || !session) {
      toast.error("Invalid request parameters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs?status=Completed`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch payroll runs.");
      }
      setPayrollRuns(data);

      // Auto-select first run if available
      if (data.length > 0 && !selectedRun) {
        setSelectedRun(data[0]);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session, selectedRun]);

  // Fetch payroll data when selected run changes
  const fetchPayrollData = useCallback(async () => {
    if (!companyId || !session || !selectedRun) return;

    setTableLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/${selectedRun?.id}/prepare`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      // FILTER LOGIC: Only show approved payments
      const approvedPayments = response.data.filter(
        (item: PayrollReportData) => item.reviewStatus === "APPROVED",
      );
      setData(approvedPayments);
      setRowSelection({}); // Reset selection when data changes
    } catch (error) {
      console.error("Error fetching earnings data:", error);
      toast.error("Failed to load payroll data. Please try again.");
    } finally {
      setTableLoading(false);
    }
  }, [companyId, selectedRun, session]);

  useEffect(() => {
    fetchPayrollRuns();
  }, [fetchPayrollRuns]);

  useEffect(() => {
    if (selectedRun) {
      fetchPayrollData();
    }
  }, [selectedRun, fetchPayrollData]);

  // Function to handle payslip preview
  const handlePreviewPdf = (payrollDetailId: string) => {
    if (!companyId || !session) {
      toast.error("Authentication token is missing. Please log in again.");
      return;
    }

    const pdfUrl = `${API_BASE_URL}/company/${companyId}/payroll/payslip/${payrollDetailId}/download?preview=true&token=${session.access_token}`;
    window.open(pdfUrl, "_blank");
  };

  // Function to handle single payslip email
  const handleEmailSinglePayslip = async (payrollDetailId: string) => {
    if (!companyId || !session) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    const toastId = toast.loading("Sending payslip via email...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/payslip/${payrollDetailId}/email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send payslip email.");
      }

      const resData = await response.json();
      toast.success(resData.message || "Payslip email sent successfully.", {
        id: toastId,
      });
    } catch (error: unknown) {
      console.error("Error emailing payslip:", error);
      toast.error((error as Error).message || "Error sending payslip email.", {
        id: toastId,
      });
    }
  };

  // Function to handle bulk payslip email
  const handleEmailBulkPayslips = async (itemsToEmail: PayrollReportData[]) => {
    if (itemsToEmail.length === 0) {
      toast.error("No employees selected for email.");
      return;
    }
    if (!companyId || !session) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    setIsBulkSending(true);
    let successCount = 0;
    let failCount = 0;

    const toastId = toast.loading(`Sending emails to ${itemsToEmail.length} employees...`);

    try {
      for (const item of itemsToEmail) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/company/${companyId}/payroll/payslip/${item.id}/email`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            const errorData = await response.json();
            console.error(
              `Failed to send email for ID ${item.id}:`,
              errorData.error,
            );
          }
        } catch (error) {
          failCount++;
          console.error(`Error sending email for ID ${item.id}:`, error);
        }
      }

      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully sent all ${successCount} emails.`, { id: toastId });
      } else if (successCount > 0) {
        toast.warning(`Sent ${successCount} emails. Failed ${failCount}.`, { id: toastId });
      } else {
        toast.error("Failed to send any emails.", { id: toastId });
      }
    } finally {
      setIsBulkSending(false);
      setRowSelection({});
    }
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPayrollRuns();
    if (selectedRun) {
      await fetchPayrollData();
    }
    setIsRefreshing(false);
    toast.success("Data refreshed successfully!");
  };

  const columns: ColumnDef<PayrollReportData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5 shadow-none cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5 shadow-none cursor-pointer"
        />
      ),
      enableSorting: false,
      size: 50,
    },
    {
      accessorKey: "fullName",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 min-w-50">
          <Avatar className="h-8 w-8 bg-linear-to-br from-[#1F3A8A] to-[#2E4AB0] text-white">
            <AvatarFallback className="text-xs font-bold bg-inherit text-white">
              {getInitials(row.original.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">
              {row.original.fullName}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.jobTitle}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-slate-600 font-medium">
          {row.original.department}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-slate-600">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <EmployeeStatusBadge status={row.original.reviewStatus} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePreviewPdf(row.original.id)}
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Preview Payslip</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEmailSinglePayslip(row.original.id)}
                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send Payslip via Email</p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  if (loading) {
    return (
      <Card className="rounded-sm h-[calc(100vh-2rem)] flex items-center justify-center border border-gray-200 shadow-none m-2">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F3A8A]" />
          <span className="ml-3 text-gray-600">Loading payroll runs...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="m-2 space-y-4">
        {/* Header Card */}
        <Card className="rounded-sm border border-slate-300 shadow-none bg-linear-to-r from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => navigate(`/company/${companyId}/modules`)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-gray-900 cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Back to module overview</p>
                  </TooltipContent>
                </Tooltip>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Payslip Management
                  </CardTitle>
                  <CardDescription className="text-gray-500 mt-1">
                    Send payslips to employees for completed payroll runs
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="h-8 w-8 text-gray-500 hover:text-gray-900"
                    >
                      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh data</p>
                  </TooltipContent>
                </Tooltip>
                
                {selectedRun && (
                  <Badge
                    variant="outline"
                    className="border-[#1F3A8A]/30 text-[#1F3A8A] bg-[#1F3A8A]/5 rounded-md px-3 py-1.5 font-medium"
                  >
                    <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                    {selectedRun.payroll_month} {selectedRun.payroll_year}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Card */}
        <Card className="rounded-sm border border-slate-300 shadow-none overflow-hidden">
          {/* Payroll Run Selector Section */}
          <div className="border-b border-slate-200 bg-slate-50/50 p-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1 max-w-md">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Select Payroll Run
                </label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between shadow-none bg-white border-gray-300 hover:border-gray-400 rounded-sm h-10"
                    >
                      {selectedRun ? (
                        <span className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-gray-400" />
                          <span>
                            {selectedRun.payroll_number} ({selectedRun.payroll_month}{" "}
                            {selectedRun.payroll_year})
                          </span>
                        </span>
                      ) : (
                        "Select a payroll run..."
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-75 p-0 rounded-sm border border-slate-300 shadow-lg">
                    <Command>
                      <CommandInput placeholder="Search payroll run..." />
                      <CommandEmpty>No payroll run found.</CommandEmpty>
                      <CommandGroup>
                        {payrollRuns.map((run) => (
                          <CommandItem
                            key={run.id}
                            value={`${run.payroll_number} ${run.payroll_month} ${run.payroll_year}`}
                            onSelect={() => {
                              setSelectedRun(run);
                              setOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {run.payroll_number}
                              </span>
                              <span className="text-xs text-gray-500">
                                {run.payroll_month} {run.payroll_year}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {payrollRuns.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-sm flex-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    No completed payroll runs found. Complete a payroll run to
                    send payslips.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Table Section */}
          {selectedRun && payrollRuns.length > 0 ? (
            <div className="p-5">
              {/* Bulk Actions Bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedItems.length > 0 && (
                    <Button
                      onClick={() => handleEmailBulkPayslips(selectedItems)}
                      disabled={isBulkSending}
                      className="bg-[#1F3A8A] text-white hover:bg-[#1F3A8A]/90 shadow-none"
                      size="sm"
                    >
                      {isBulkSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Send to {selectedItems.length} Selected
                    </Button>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  {data.length} employee{data.length !== 1 ? 's' : ''} eligible for payslips
                </div>
              </div>

              {/* Table */}
              {tableLoading ? (
                <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1F3A8A]" />
                  <span className="ml-3 text-gray-600">Loading payslip data...</span>
                </div>
              ) : data.length > 0 ? (
                <div className="border border-slate-200 px-2  rounded-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-slate-50 border-slate-200">
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="font-semibold text-slate-700">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="hover:bg-slate-50/50 border-slate-200"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-sm">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Mail className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-gray-900 font-medium mb-1">No eligible employees</p>
                    <p className="text-sm text-gray-500 max-w-sm">
                      There are no employees with approved status for this payroll run.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : payrollRuns.length > 0 ? (
            <div className="text-center py-20 bg-white">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <CalendarClock className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-gray-900 font-medium text-lg mb-2">No Payroll Run Selected</p>
                <p className="text-sm text-gray-500 max-w-md">
                  Please select a completed payroll run from the dropdown above to view and send payslips.
                </p>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Footer with Summary (optional) */}
        {selectedRun && data.length > 0 && (
          <Card className="rounded-sm border border-slate-300 shadow-none bg-slate-50/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Total eligible employees:</span>
                  <span className="font-semibold text-[#1F3A8A]">{data.length}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Selected for sending:</span>
                  <span className="font-semibold text-emerald-600">{selectedItems.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}