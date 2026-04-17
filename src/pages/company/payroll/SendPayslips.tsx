import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Mail,
  CalendarClock,
  ChevronDown,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
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
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

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
    <Badge
      variant="outline"
      className={`${getVariant(status)} font-medium flex items-center w-fit px-2 py-0.5 text-xs rounded-full`}
    >
      {getIcon(status)}
      {toProperCase(status)}
    </Badge>
  );
};

export default function SendPayslip() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(true);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [data, setData] = useState<PayrollReportData[]>([]);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

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
        `${API_BASE_URL}/company/${companyId}/payroll/runs?status=all&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to fetch payroll runs.");
      }

      const runsData = responseData.data || [];
      setPayrollRuns(runsData);

      if (runsData.length > 0) {
        setSelectedRun(runsData[0]);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

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

      const approvedPayments = response.data.filter(
        (item: PayrollReportData) => item.reviewStatus === "APPROVED",
      );
      setData(approvedPayments);
      setRowSelection({});
      setGlobalFilter(""); // Reset search when data changes
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

  const handlePreviewPdf = (payrollDetailId: string) => {
    if (!companyId || !session) {
      toast.error("Authentication token is missing. Please log in again.");
      return;
    }

    const pdfUrl = `${API_BASE_URL}/company/${companyId}/payroll/payslip/${payrollDetailId}/download?preview=true&token=${session.access_token}`;
    window.open(pdfUrl, "_blank");
  };

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

    const toastId = toast.loading(
      `Sending emails to ${itemsToEmail.length} employees...`,
    );

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
        toast.success(`Successfully sent all ${successCount} emails.`, {
          id: toastId,
        });
      } else if (successCount > 0) {
        toast.warning(`Sent ${successCount} emails. Failed ${failCount}.`, {
          id: toastId,
        });
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

  // Global filter function for search
  const globalFilterFn = (row: { original: PayrollReportData }, _columnId: string, filterValue: string) => {
    const search = filterValue.toLowerCase();
    const item = row.original;

    return (
      item.fullName?.toLowerCase().includes(search) ||
      item.department?.toLowerCase().includes(search) ||
      item.email?.toLowerCase().includes(search) ||
      item.jobTitle?.toLowerCase().includes(search)
    );
  };

  const columns: ColumnDef<PayrollReportData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="shadow-none border-[#7F5EFD] cursor-pointer data-[state=checked]:bg-[#7F5EFD] data-[state=checked]:border-[#7F5EFD]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="shadow-none border-[#7F5EFD] cursor-pointer data-[state=checked]:bg-[#7F5EFD] data-[state=checked]:border-[#7F5EFD]"
        />
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: "fullName",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-linear-to-br from-[#7F5EFD] to-[#5D40C6] text-white">
            <AvatarFallback className="text-xs font-bold bg-inherit text-white">
              {getInitials(row.original.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 text-sm">
              {row.original.fullName}
            </span>
            <span className="text-xs text-slate-500">
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
        <span className="text-sm text-slate-600">
          {row.original.department}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "reviewStatus",
      header: "Status",
      cell: ({ row }) => (
        <EmployeeStatusBadge status={row.original.reviewStatus} />
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePreviewPdf(row.original.id)}
                  className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Eye className="h-3.5 w-3.5" />
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
                  className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <Mail className="h-3.5 w-3.5" />
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
      globalFilter,
    },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  const filteredDataLength = table.getFilteredRowModel().rows.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Card className="rounded-sm shadow-none border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="h-full flex flex-col p-6">
            {/* Header with minimalist toolbar */}
            <div className="shrink-0 flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <h1 className="text-lg font-semibold text-slate-900">
                    Payslip Management
                  </h1>
                </div>

                {/* Payroll Run Selector */}
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="h-8 w-78 justify-between text-sm border-slate-300 rounded-sm font-normal"
                    >
                      {selectedRun ? (
                        <span className="flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {selectedRun.payroll_number} (
                            {selectedRun.payroll_month}{" "}
                            {selectedRun.payroll_year})
                          </span>
                        </span>
                      ) : (
                        "Select a payroll run..."
                      )}
                      <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 rounded-md border-slate-200 shadow-lg">
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
                              <span className="font-medium text-sm">
                                {run.payroll_number}
                              </span>
                              <span className="text-xs text-slate-500">
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

              <div className="flex items-center gap-1">
                {/* Search with toggle */}
                <div className="relative">
                  {showSearch ? (
                    <div className="relative animate-in slide-in-from-left-2 fade-in duration-200">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Search by name, department, email..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        onBlur={() => {
                          if (!globalFilter) setShowSearch(false);
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
                      <TooltipContent side="bottom">
                        Search employees
                      </TooltipContent>
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
                      disabled={isRefreshing}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-4 w-4 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Refresh data</TooltipContent>
                </Tooltip>

                {/* Bulk Send Button */}
                {selectedItems.length > 0 && (
                  <Button
                    onClick={() => handleEmailBulkPayslips(selectedItems)}
                    disabled={isBulkSending}
                    size="sm"
                    className="ml-2 h-8 text-xs rounded-md cursor-pointer bg-[#7F5EFD] hover:bg-[#6a4ad3] shadow-none"
                  >
                    {isBulkSending ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Send to {selectedItems.length}
                  </Button>
                )}
              </div>
            </div>

            {/* Counter */}
            <div className="shrink-0 py-2">
              <p className="text-xs text-slate-400">
                {filteredDataLength} employee
                {filteredDataLength !== 1 ? "s" : ""} found
                {globalFilter && ` (filtered from ${data.length})`}
              </p>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-hidden mt-2">
              {!selectedRun ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <CalendarClock className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-medium mb-1">
                    No Payroll Run Selected
                  </p>
                  <p className="text-sm text-slate-500">
                    Select a completed payroll run from the dropdown above
                  </p>
                </div>
              ) : payrollRuns.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-medium mb-1">
                    No Payroll Runs Found
                  </p>
                  <p className="text-sm text-slate-500">
                    Complete a payroll run to send payslips
                  </p>
                </div>
              ) : tableLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-medium mb-1">
                    No eligible employees
                  </p>
                  <p className="text-sm text-slate-500">
                    No employees with approved status for this payroll run
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col space-y-2">
                  {/* Table Container */}
                  <div className="flex-1 overflow-auto min-h-0 rounded-sm border border-slate-200 px-1">
                    <Table className="relative">
                      <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow
                            key={headerGroup.id}
                            className="hover:bg-transparent"
                          >
                            {headerGroup.headers.map((header) => (
                              <TableHead
                                key={header.id}
                                className="h-8 text-xs font-medium text-slate-500"
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="py-3">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-32 text-center"
                            >
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <Search className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">
                                  No matching employees found
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
