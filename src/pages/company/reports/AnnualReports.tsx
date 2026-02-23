// src/pages/company/payroll/reports/AnnualReportSection.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  Loader2,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axios from "axios";

const AnnualReports = () => {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [loading, setLoading] = useState(true);
  //const [downloading, setDownloading] = useState(false);
  const [downloadingYear, setDownloadingYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // 1. Fetch available years for completed payroll runs
  const fetchAvailableYears = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/available-years`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      const years = response.data;
      setAvailableYears(years);
    } catch (error) {
      console.error("Failed to fetch available years:", error);
      let errorMessage = "An unknown error occurred.";

      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          error.response.data.error ||
          `Server responded with status ${error.response.status}.`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(`Failed to load available years: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchAvailableYears();
  }, [fetchAvailableYears]);

  // 2. Handle report download for a specific year
  const handleDownloadReport = async (year: number) => {
    setDownloadingYear(year);
    try {
      const url = `${API_BASE_URL}/company/${companyId}/payroll/runs/annual-gross-earnings?year=${year}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `Annual_Gross_Earnings_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(
        `Annual Gross Earnings Report for ${year} downloaded successfully.`,
      );
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        `Failed to download the Annual Gross Earnings Report for ${year}.`,
      );
    } finally {
      setDownloadingYear(null);
    }
  };

  return (
    <TooltipProvider>
      <Card className="m-2 rounded-sm border border-slate-200 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
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
              <CardTitle className="text-xl font-semibold text-gray-900">
                Annual Gross Earnings Report
              </CardTitle>
              <CardDescription className="text-gray-500 mt-1">
                Generate and download annual reports showing total gross
                earnings per employee
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-[#1F3A8A]/30 text-[#1F3A8A] bg-[#1F3A8A]/5 rounded-md px-3 py-1 font-medium"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              Excel Format
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1F3A8A]" />
              <span className="ml-2 text-gray-600">
                Loading available years...
              </span>
            </div>
          ) : availableYears.length > 0 ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Select a year to generate report
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleDownloadReport(year)}
                      disabled={downloadingYear === year}
                      className="group relative flex flex-col items-center p-5 bg-white border border-gray-200 hover:border-[#1F3A8A] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1F3A8A] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200"
                    >
                      {downloadingYear === year ? (
                        <>
                          <Loader2 className="h-8 w-8 text-[#1F3A8A] mb-3 animate-spin" />
                          <span className="text-sm font-medium text-gray-900">
                            Downloading...
                          </span>
                        </>
                      ) : (
                        <>
                          <Calendar className="h-8 w-8 text-gray-400 group-hover:text-[#1F3A8A] mb-3" />
                          <span className="text-lg font-medium text-gray-900">
                            {year}
                          </span>
                          <Badge
                            variant="outline"
                            className="mt-2 text-xs bg-gray-50 border-gray-200"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Annual Report
                          </Badge>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-200" />

              <div className="bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      About this report
                    </h4>
                    <p className="text-sm text-gray-500">
                      The Annual Gross Earnings Report provides a comprehensive
                      summary of each employee's total gross earnings for the
                      selected tax year. The report is generated in Excel format
                      for easy analysis and further processing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 border border-gray-200">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                No completed payroll runs found
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Complete payroll runs to generate annual reports
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default AnnualReports;
