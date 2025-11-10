// src/pages/company/payroll/PayrollFilesSection.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Define a type for your payroll runs
type PayrollRun = {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
};

const PayrollFilesSection = () => {
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(true);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
        }
      );
      const data = await res.json();
      console.log("Fetched Payroll Runs:", data);
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch payroll runs.");
      }
      setPayrollRuns(data);
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

  const handleDownloadReport = async (reportType: string) => {
    if (!selectedRun) {
      toast.error("Please select a payroll run first.");
      return;
    }

    setDownloading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/${companyId}/payroll/runs/${selectedRun.id}/reports/${reportType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download report.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // ✅ match backend switch
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
          fileExtension = "xlsx"; // fallback
      }
      link.download = `${reportType}_${selectedRun.payroll_number}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Report downloaded successfully.`);
    } catch (error: unknown) {
      console.error("Error downloading report:", error);
      toast.error((error as Error).message || "Error downloading report.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-gray-400" />
        <span className="text-gray-500">Loading payroll runs...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Payroll Reports & Files
        </CardTitle>
        <CardDescription>
          Select a completed payroll run to download various statutory and
          internal reports.
        </CardDescription>
      </CardHeader>
      <Separator className="my-4" />
      <CardContent>
        <div className="mb-6 flex items-center space-x-4">
          <span className="font-semibold text-sm text-gray-700">
            Select Payroll Run:
          </span>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[300px] justify-between"
              >
                {selectedRun
                  ? selectedRun.payroll_number
                  : "Select a payroll run..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search payroll run..." />
                <CommandEmpty>No payroll run found.</CommandEmpty>
                <CommandGroup>
                  {payrollRuns.map((run) => (
                    <CommandItem
                      key={run.id}
                      value={run.payroll_number}
                      onSelect={() => {
                        setSelectedRun(run);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedRun?.id === run.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {run.payroll_number} ({run.payroll_month}{" "}
                      {run.payroll_year})
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {selectedRun && (
          <>
            <h3 className="text-lg font-bold mb-6 text-center">
              Reports for {selectedRun.payroll_number}
            </h3>

            <Tabs defaultValue="statutory" className="w-full">
              <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
                <TabsTrigger value="statutory">Statutory</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="internal">Internal</TabsTrigger>
              </TabsList>

              {/* Statutory Reports */}
              <TabsContent value="statutory">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[
                    { type: "kra-sec-b1", label: "KRA SEC B1" },
                    { type: "nssf-return", label: "NSSF Return" },
                    { type: "shif-return", label: "SHIF Return" },
                    { type: "housing-levy-return", label: "Housing Levy" },
                    { type: "helb-report", label: "HELB Report" },
                  ].map((r) => (
                    <Button
                      key={r.type}
                      onClick={() => handleDownloadReport(r.type)}
                      disabled={downloading}
                      className="w-full bg-[#7F5EFD] hover:bg-[#6D4EFA]"
                    >
                      {downloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {r.label}
                    </Button>
                  ))}
                </div>
              </TabsContent>

              {/* Payment Files */}
              <TabsContent value="payments">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                  {[
                    { type: "bank-payment", label: "Bank File" },
                    { type: "mpesa-payment", label: "M-Pesa File" },
                    { type: "cash-payment", label: "Cash Sheet" },
                  ].map((r) => (
                    <Button
                      key={r.type}
                      onClick={() => handleDownloadReport(r.type)}
                      disabled={downloading}
                      className="w-full bg-[#7F5EFD] hover:bg-[#6D4EFA]"
                    >
                      {downloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {r.label}
                    </Button>
                  ))}
                </div>
              </TabsContent>

              {/* Internal Reports */}
              <TabsContent value="internal">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { type: "payroll-summary", label: "Payroll Summary" },
                    { type: "annual-report", label: "Annual Report" },
                    { type: "allowance-report", label: "Allowance Report" },
                    { type: "deduction-report", label: "Deduction Report" },
                  ].map((r) => (
                    <div
                      key={r.type}
                      className="flex flex-col gap-2 items-center justify-between bg-gray-50 border rounded-lg p-3 hover:shadow-sm transition"
                    >
                      <span className="font-medium text-gray-800 text-sm">
                        {r.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloading}
                          onClick={() =>
                            toast.info(`${r.label} preview not available yet.`)
                          }
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#7F5EFD] hover:bg-[#6D4EFA]"
                          disabled={downloading}
                          onClick={() => handleDownloadReport(r.type)}
                        >
                          {downloading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
        {!selectedRun && payrollRuns.length > 0 && (
          <p className="text-center text-gray-500 mt-8">
            Please select a payroll run from the dropdown to enable file
            downloads.
          </p>
        )}
        {payrollRuns.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No completed payroll runs found for this company.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PayrollFilesSection;
