// src/components/company/payroll/PayrollFilesSection.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
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
//import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CalendarClock,
  ChevronDown,
  AlertCircle,
  ArrowLeft,
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
//import { cn } from "@/lib/utils";

import StatutoryReports from "@/components/company/reports/StatutoryReports";
import PaymentsReports from "@/components/company/reports/PaymentsReports";
import InternalReports from "@/components/company/reports/InternalReports";

type PayrollRun = {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
};

const ReportOverview = () => {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(true);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

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
      if (data.length > 0) {
        setSelectedRun(data[0]);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchPayrollRuns();
  }, [fetchPayrollRuns]);

  const handlePreviewReport = async (report: {
    type: string;
    label: string;
  }) => {
    if (!selectedRun) {
      toast.error("Please select a payroll run first.");
      return;
    }

    const token = session?.access_token;
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    let fileType = "";
    switch (report.type) {
      case "kra-sec-b1":
      case "housing-levy-return":
      case "bank-payment":
      case "mpesa-payment":
        fileType = "csv";
        break;
      case "cash-payment":
        fileType = "pdf";
        break;
      case "nssf-return":
      case "shif-return":
      case "helb-report":
      case "payroll-summary":
      case "allowance-report":
      case "deduction-report":
        fileType = "xlsx";
        break;
      default:
        fileType = "xlsx";
    }

    const reportUrl = `${API_BASE_URL}/company/${companyId}/payroll/runs/${selectedRun.id}/reports/${report.type}?download=false&token=${token}`;

    navigate(
      `/company/${companyId}/reports/report-preview?file=${encodeURIComponent(
        reportUrl,
      )}&name=${encodeURIComponent(report.label)}&type=${fileType}`,
    );
  };

  const handleDownloadReport = async (reportType: string) => {
    if (!selectedRun) {
      toast.error("Please select a payroll run first.");
      return;
    }

    setDownloading(reportType);

    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/${companyId}/payroll/runs/${selectedRun.id}/reports/${reportType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download report.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      let fileExtension: string;
      switch (reportType) {
        case "kra-sec-b1":
        case "housing-levy-return":
        case "bank-payment":
        case "mpesa-payment":
          fileExtension = "csv";
          break;
        case "cash-payment":
          fileExtension = "pdf";
          break;
        case "nssf-return":
        case "shif-return":
        case "helb-report":
        case "payroll-summary":
        case "allowance-report":
        case "deduction-report":
          fileExtension = "xlsx";
          break;
        default:
          fileExtension = "xlsx";
      }

      link.download = `${reportType}_${selectedRun.payroll_number}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${reportType} downloaded successfully.`);
    } catch (error: unknown) {
      console.error("Error downloading report:", error);
      toast.error((error as Error).message || "Error downloading report.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-sm h-screen flex items-center justify-center border border-gray-200 shadow-none">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F3A8A]" />
          <span className="ml-3 text-gray-600">Loading payroll runs...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="m-2 rounded-sm border border-slate-300 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger className="cursor-default">
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
                  Payroll Reports & Files
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                  Generate and download statutory, payment, and internal reports
                  for completed payroll runs
                </CardDescription>
              </div>
            </div>
            {selectedRun && (
              <Badge
                variant="outline"
                className="border-[#1F3A8A]/30 text-[#1F3A8A] bg-[#1F3A8A]/5 rounded-md px-3 py-1 font-medium"
              >
                <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                {selectedRun.payroll_month} {selectedRun.payroll_year}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payroll Run Selector */}
          <div className="bg-gray-50 rounded-sm border border-slate-300 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="min-w-50">
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
                        <span>
                          {selectedRun.payroll_number} (
                          {selectedRun.payroll_month} {selectedRun.payroll_year}
                          )
                        </span>
                      ) : (
                        "Select a payroll run..."
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-100 p-0 rounded-sm border border-slate-300 shadow-lg">
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
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 p-3">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    No completed payroll runs found. Complete a payroll run to
                    generate reports.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reports Tabs */}
          {selectedRun && payrollRuns.length > 0 ? (
            <Tabs defaultValue="statutory" className="w-full">
              <TabsList className="grid grid-cols-3 w-full max-w-md border border-gray-200 bg-gray-50 p-0 rounded-sm">
                <TabsTrigger
                  value="statutory"
                  className="rounded-sm data-[state=active]:bg-[#1F3A8A] data-[state=active]:text-white py-2.5"
                >
                  Statutory
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="rounded-sm data-[state=active]:bg-[#1F3A8A] data-[state=active]:text-white py-2.5"
                >
                  Payments
                </TabsTrigger>
                <TabsTrigger
                  value="internal"
                  className="rounded-sm data-[state=active]:bg-[#1F3A8A] data-[state=active]:text-white py-2.5"
                >
                  Internal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="statutory" className="mt-6">
                <StatutoryReports
                  selectedRun={selectedRun}
                  downloading={downloading}
                  onPreview={handlePreviewReport}
                  onDownload={handleDownloadReport}
                />
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <PaymentsReports
                  selectedRun={selectedRun}
                  downloading={downloading}
                  onPreview={handlePreviewReport}
                  onDownload={handleDownloadReport}
                />
              </TabsContent>

              <TabsContent value="internal" className="mt-6">
                <InternalReports
                  selectedRun={selectedRun}
                  downloading={downloading}
                  onPreview={handlePreviewReport}
                  onDownload={handleDownloadReport}
                />
              </TabsContent>
            </Tabs>
          ) : payrollRuns.length > 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-gray-200">
              <CalendarClock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Select a payroll run</p>
              <p className="text-sm text-gray-500 mt-1">
                Choose a completed payroll run from the dropdown above to view
                available reports
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ReportOverview;
