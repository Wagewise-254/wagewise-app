// src/pages/company/payroll/reports/AnnualReportSection.tsx

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
import { Loader2, Download, Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils"; 
import axios from "axios";

const AnnualReportSection = () => {
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // 1. Fetch available years for completed payroll runs
  const fetchAvailableYears = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch unique years from completed payroll runs
      const response = await axios.get(`${API_BASE_URL}/companies/${companyId}/payroll/runs/available-years`, {
  headers: {
    Authorization: `Bearer ${session?.access_token}`,
  },
});

      // The response.data is directly the array of years
            const years = response.data; 
            setAvailableYears(years);
            if (years.length > 0) {
                setSelectedYear(years[0]);
            }
    } catch (error) {
      console.error("Failed to fetch available years:", error);
            let errorMessage = "An unknown error occurred.";

            if (axios.isAxiosError(error) && error.response) {
                // Now correctly looking for the 'error' key returned by the backend (section 1 fix)
                errorMessage = error.response.data.error || `Server responded with status ${error.response.status}.`;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            // This toast message will now show the specific backend error message
            toast.error(`Failed to load available years: ${errorMessage}`);
            
        } finally {
            setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchAvailableYears();
  }, [fetchAvailableYears]);

  // 2. Handle report download
  const handleDownloadReport = async () => {
    if (!selectedYear) {
      toast.error("Please select a year.");
      return;
    }

    setDownloading(true);
    try {
      // The new route added to reportsRoutes.js
      const url = `${API_BASE_URL}/companies/${companyId}/payroll/runs/annual-gross-earnings?year=${selectedYear}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        responseType: 'blob', // **Crucial** for downloading files
      });

      // Trigger download
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Annual_Gross_Earnings_${selectedYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Annual Gross Earnings Report downloaded successfully.");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download the Annual Gross Earnings Report.");
    } finally {
      setDownloading(false);
    }
  };

  const selectedYearLabel = selectedYear ? String(selectedYear) : "Select year...";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annual Gross Earnings Report</CardTitle>
        <CardDescription>
          Generate and download the annual report showing total gross earnings per employee in Excel format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">
              Select Reporting Year
            </label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isPopoverOpen}
                  className={cn(
                    "w-full justify-between",
                    !selectedYear && "text-muted-foreground"
                  )}
                  disabled={loading || availableYears.length === 0}
                >
                  {loading
                    ? "Loading years..."
                    : selectedYearLabel}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search year..." />
                  <CommandEmpty>No year found.</CommandEmpty>
                  <CommandGroup>
                    {availableYears.map((year) => (
                      <CommandItem
                        key={year}
                        value={String(year)} // Added value prop for search
                        onSelect={() => {
                          setSelectedYear(year);
                          setIsPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedYear === year ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {year}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            onClick={handleDownloadReport}
            disabled={downloading || !selectedYear}
            className="w-full md:w-auto"
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Generate Excel Report
          </Button>
        </div>
        {!loading && availableYears.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No completed payroll runs found to generate annual reports.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnualReportSection;