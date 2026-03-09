// src/pages/company/reports/PayrollRunReports.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CalendarClock,
  ArrowLeft,
  FileText,
  Calendar,
  Hash,
} from "lucide-react";

import StatutoryReports from "@/components/company/reports/StatutoryReports";
import PaymentsReports from "@/components/company/reports/PaymentsReports";
import InternalReports from "@/components/company/reports/InternalReports";

interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
  status: string;
}

interface LocationState {
  fromWizard?: boolean;
  payrollRunId?: string;
}

const PayrollRunReports = () => {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId, payrollRunId } = useParams<{ 
    companyId: string; 
    payrollRunId: string 
  }>();
  
  const [loading, setLoading] = useState(true);
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const locationState = location.state as LocationState;
  const fromWizard = locationState?.fromWizard || false;

  // Fetch the specific payroll run details
  const fetchPayrollRun = useCallback(async () => {
    if (!companyId || !payrollRunId || !session) {
      toast.error("Invalid request parameters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/${payrollRunId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch payroll run.");
      }
      
      setPayrollRun(data);
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [companyId, payrollRunId, session]);

  useEffect(() => {
    fetchPayrollRun();
  }, [fetchPayrollRun]);

  const handlePreviewReport = async (report: {
    type: string;
    label: string;
  }) => {
    if (!payrollRun) {
      toast.error("Payroll run information not available.");
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

    const reportUrl = `${API_BASE_URL}/company/${companyId}/payroll/runs/${payrollRun.id}/reports/${report.type}?download=false&token=${token}`;

    navigate(
      `/company/${companyId}/reports/report-preview?file=${encodeURIComponent(
        reportUrl,
      )}&name=${encodeURIComponent(report.label)}&type=${fileType}`,
    );
  };

  const handleDownloadReport = async (reportType: string) => {
    if (!payrollRun) {
      toast.error("Payroll run information not available.");
      return;
    }

    setDownloading(reportType);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/${payrollRun.id}/reports/${reportType}`,
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

      link.download = `${reportType}_${payrollRun.payroll_number}.${fileExtension}`;
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

  const handleBack = () => {
    if (fromWizard && payrollRunId) {
      // Go back to the payroll wizard
      navigate(`/company/${companyId}/payroll/${payrollRunId}/wizard`);
    } else {
      // Go back to the main reports overview
      navigate(`/company/${companyId}/reports/overview`);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-sm h-screen flex items-center justify-center border border-gray-200 shadow-none">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F3A8A]" />
          <span className="ml-3 text-gray-600">Loading payroll run details...</span>
        </CardContent>
      </Card>
    );
  }

  if (!payrollRun) {
    return (
      <Card className="m-2 rounded-sm border border-slate-300 shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Payroll run not found</p>
          <p className="text-sm text-gray-500 mt-1">
            The requested payroll run could not be found.
          </p>
          <Button
            onClick={handleBack}
            variant="outline"
            className="mt-4 rounded-sm"
          >
            Go Back
          </Button>
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
                    onClick={handleBack}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-900 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{fromWizard ? "Back to payroll wizard" : "Back to reports overview"}</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Payroll Run Reports
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                  Generate and download reports for this specific payroll run
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-[#1F3A8A]/30 text-[#1F3A8A] bg-[#1F3A8A]/5 rounded-md px-3 py-1 font-medium"
              >
                <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                {payrollRun.payroll_month} {payrollRun.payroll_year}
              </Badge>
              <Badge
                variant="outline"
                className="border-gray-300 text-gray-700 bg-gray-50 rounded-md px-3 py-1 font-medium"
              >
                <Hash className="h-3.5 w-3.5 mr-1.5" />
                {payrollRun.payroll_number}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payroll Run Summary */}
          <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-sm border border-indigo-100 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Selected Payroll Run</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {payrollRun.payroll_month} {payrollRun.payroll_year}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1">
                  {payrollRun.status}
                </Badge>
                <p className="text-sm text-gray-500">
                  Run #{payrollRun.payroll_number}
                </p>
              </div>
            </div>
          </div>

          {/* Reports Tabs */}
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
                selectedRun={payrollRun}
                downloading={downloading}
                onPreview={handlePreviewReport}
                onDownload={handleDownloadReport}
              />
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <PaymentsReports
                selectedRun={payrollRun}
                downloading={downloading}
                onPreview={handlePreviewReport}
                onDownload={handleDownloadReport}
              />
            </TabsContent>

            <TabsContent value="internal" className="mt-6">
              <InternalReports
                selectedRun={payrollRun}
                downloading={downloading}
                onPreview={handlePreviewReport}
                onDownload={handleDownloadReport}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default PayrollRunReports;