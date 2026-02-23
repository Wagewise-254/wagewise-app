// src/pages/company/payroll/payRuns/P9Section.tsx

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
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Loader2,
  MoreHorizontal,
  Download,
  Mail,
  FileText,
  ArrowLeft,
  Calendar,
  Users,
  Search,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

// Define types for data
type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
};

type ViewMode = "year-selection" | "employee-table";

const P9AReports = () => {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  //const [openYear, setOpenYear] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("year-selection");

  // Fetch unique payroll years and employee list
  const fetchP9Data = useCallback(async () => {
    if (!companyId || !session) {
      toast.error("Invalid request parameters.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch employees for the company
      const employeesRes = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );
      const employeesData = await employeesRes.json();
      if (!employeesRes.ok)
        throw new Error(employeesData.error || "Failed to fetch employees.");
      setEmployees(employeesData);

      // Fetch unique years from completed payroll runs
      const yearsRes = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/years`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );
      const yearsData = await yearsRes.json();
      if (
        !yearsRes.ok ||
        !yearsData.success ||
        !Array.isArray(yearsData.data)
      ) {
        throw new Error(yearsData.error || "Failed to fetch payroll years.");
      }

      const uniqueYears = yearsData.data.sort().reverse() as number[];
      setYears(uniqueYears);
    } catch (error: unknown) {
      console.error("Error fetching P9 data:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to load P9 data.");
      } else {
        toast.error("Failed to load P9 data.");
      }
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchP9Data();
  }, [fetchP9Data]);

  //console.log("openYear:", openYear);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setViewMode("employee-table");
    setCurrentPage(1);
    setSearchTerm("");
    setSelectedEmployees([]);
    //setOpenYear(false);
  };

  const handleBackToYears = () => {
    setViewMode("year-selection");
    setSelectedYear(null);
  };

  const handlePreviewPdf = (employeeId: string) => {
    const token = session?.access_token;

    if (!token) {
      toast.error("Authentication token is missing. Please log in again.");
      return;
    }

    const previewUrl = `${API_BASE_URL}/company/${companyId}/employees/${employeeId}/p9a/${selectedYear}?preview=true&token=${token}`;
    window.open(previewUrl, "_blank");
  };

  const handleDownloadP9A = useCallback(
    async (employeeId: string, employeeName: string) => {
      if (!companyId || !selectedYear) {
        toast.error("Please select a year first.");
        return;
      }

      setDownloading(employeeId);
      try {
        const res = await fetch(
          `${API_BASE_URL}/company/${companyId}/employees/${employeeId}/p9a/${selectedYear}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          },
        );
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${res.status}`,
          );
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `P9A_${employeeName.replace(/\s/g, "_")}_${selectedYear}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success(`P9A for ${employeeName} downloaded successfully.`);
      } catch (error: unknown) {
        console.error("Error downloading P9A:", error);
        if (error instanceof Error) {
          toast.error(error.message || "Failed to download P9A.");
        } else {
          toast.error("Failed to download P9A.");
        }
      } finally {
        setDownloading(null);
      }
    },
    [companyId, selectedYear, session],
  );

  const handleEmailSingleP9A = async (employeeId: string, year: number) => {
    if (!companyId || !session) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    const toastId = toast.loading("Sending P9A via email...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees/${employeeId}/p9a/${year}/email`,
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
        throw new Error(errorData.error || "Failed to send P9A email.");
      }

      const data = await response.json();
      toast.success(data.message || "P9A email sent successfully.", {
        id: toastId,
      });
    } catch (error: unknown) {
      console.error("Error emailing P9A:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Error sending P9A email.", {
          id: toastId,
        });
      } else {
        toast.error("Error sending P9A email.", { id: toastId });
      }
    }
  };

  const handleEmailBulkP9As = async () => {
    if (selectedEmployees.length === 0 || !selectedYear) {
      toast.error("No employees selected or year not specified.");
      return;
    }
    if (!companyId || !session) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    setIsBulkSending(true);
    let successCount = 0;
    let failCount = 0;
    const totalSelected = selectedEmployees.length;

    const toastId = toast.loading(
      `Sending emails to ${totalSelected} employees...`,
    );

    try {
      for (const employeeId of selectedEmployees) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/company/${companyId}/employees/${employeeId}/p9a/${selectedYear}/email`,
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
              `Failed to send email for employee ${employeeId}:`,
              errorData.error,
            );
          }
        } catch (error) {
          failCount++;
          console.error(
            `Error sending email for employee ${employeeId}:`,
            error,
          );
        }
      }

      if (successCount > 0 && failCount === 0) {
        toast.success(
          `Successfully sent P9A emails to all ${successCount} selected employees.`,
          { id: toastId },
        );
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `Sent P9A emails to ${successCount} employees. Failed to send to ${failCount} employees.`,
          { id: toastId },
        );
      } else {
        toast.error("Failed to send any P9A emails.", { id: toastId });
      }
    } finally {
      setIsBulkSending(false);
      setSelectedEmployees([]);
    }
  };

  // Search and Pagination Logic
  const filteredEmployees = employees.filter(
    (employee) =>
      `${employee.first_name} ${employee.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredEmployees.map((e) => e.id);
      setSelectedEmployees(allIds);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees((prev) => [...prev, employeeId]);
    } else {
      setSelectedEmployees((prev) => prev.filter((id) => id !== employeeId));
    }
  };

  const isAllSelected =
    selectedEmployees.length > 0 &&
    selectedEmployees.length === filteredEmployees.length;

  // Render year selection view
  const renderYearSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Select Tax Year</h3>
        <p className="text-sm text-gray-500 mt-1">
          Choose a year to generate P9A tax deduction cards for your employees.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#1F3A8A]" />
          <span className="ml-2 text-gray-600">Loading available years...</span>
        </div>
      ) : years.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => handleYearSelect(year)}
              className="group relative  rounded-xs cursor-pointer flex flex-col items-center p-6 bg-white border border-gray-200 hover:border-[#1F3A8A] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1F3A8A] focus:ring-offset-2"
            >
              <Calendar className="h-8 w-8 text-gray-400 group-hover:text-[#1F3A8A] mb-3" />
              <span className="text-lg font-medium text-gray-900">{year}</span>
              <Badge variant="outline" className="mt-2 text-xs bg-gray-50">
                {employees.length} employees
              </Badge>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-sm">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            No completed payroll runs found
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Complete payroll runs to generate P9A cards
          </p>
        </div>
      )}
    </div>
  );

  // Render employee table view
  const renderEmployeeTable = () => (
    <div className="space-y-6">
      {/* Header with back button and year info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToYears}
                className="h-8 w-8 text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              Back to year selection
            </TooltipContent>
          </Tooltip>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              P9A Tax Deduction Cards - {selectedYear}
            </h3>
            <p className="text-sm text-gray-500">
              Generate and manage P9A forms for your employees
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-[#1F3A8A] text-[#1F3A8A] bg-[#1F3A8A]/5 rounded-sm px-3 py-1 font-medium"
        >
          <Users className="h-3.5 w-3.5 mr-1.5" />
          {filteredEmployees.length} Employee
          {filteredEmployees.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Separator />

      {/* Search and bulk actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or employee number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-sm border-gray-300 shadow-none focus:border-[#1F3A8A] focus:ring-[#1F3A8A]"
          />
        </div>
        {selectedEmployees.length > 0 && (
          <Button
            onClick={handleEmailBulkP9As}
            disabled={isBulkSending}
            className="bg-[#1F3A8A] hover:bg-[#16306b] text-white rounded-sm cursor-pointer px-4 py-2 h-9 text-sm font-medium shadow-none border-0"
          >
            {isBulkSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send to {selectedEmployees.length} selected
              </>
            )}
          </Button>
        )}
      </div>

      {/* Employee table */}
      <div className="border border-slate-200 rounded-sm px-2 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12.5">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked: boolean) =>
                    handleSelectAll(checked)
                  }
                  className="border-slate-600 shadow-none data-[state=checked]:bg-[#1F3A8A] data-[state=checked]:border-[#1F3A8A]"
                />
              </TableHead>
              <TableHead className="font-medium text-gray-700">
                Employee
              </TableHead>
              <TableHead className="font-medium text-gray-700">
                Employee Number
              </TableHead>
              <TableHead className="text-right font-medium text-gray-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.length > 0 ? (
              paginatedEmployees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={(checked: boolean) =>
                        handleSelectEmployee(employee.id, checked)
                      }
                      className="border-slate-600 shadow-none data-[state=checked]:bg-[#1F3A8A] data-[state=checked]:border-[#1F3A8A]"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {employee.employee_number}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none">
                        <DropdownMenuItem
                          onClick={() =>
                            handleDownloadP9A(
                              employee.id,
                              `${employee.first_name} ${employee.last_name}`,
                            )
                          }
                          className="cursor-pointer"
                        >
                          {downloading === employee.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Download P9A
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleEmailSingleP9A(employee.id, selectedYear!)
                          }
                          className="cursor-pointer"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Email P9A
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePreviewPdf(employee.id)}
                          className="cursor-pointer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  {searchTerm
                    ? "No employees match your search"
                    : "No employees found for this company"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className={cn(
                    "cursor-pointer rounded-none border border-gray-300 hover:bg-gray-50",
                    currentPage === 1 && "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    isActive={currentPage === index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={cn(
                      "cursor-pointer rounded-none border border-gray-300",
                      currentPage === index + 1
                        ? "bg-[#1F3A8A] text-white hover:bg-[#16306b] border-[#1F3A8A]"
                        : "hover:bg-gray-50",
                    )}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={cn(
                    "cursor-pointer rounded-none border border-gray-300 hover:bg-gray-50",
                    currentPage === totalPages &&
                      "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );

  return (
    <Card className="m-2 rounded-sm border border-slate-200 shadow-none">
      <CardHeader className="pb-4">
        <Tooltip>
          <TooltipTrigger className="cursor-default self-start">
            <Button
              onClick={() => navigate(`/company/${companyId}/modules`)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center">
            Back to module overview
          </TooltipContent>
        </Tooltip>
        <CardTitle className="text-xl font-bold text-gray-900">
          P9 Tax Deduction Cards
        </CardTitle>
        <CardDescription className="text-gray-400 border-b border-gray-200 pb-4">
          Generate and download P9A tax deduction cards for your employees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {viewMode === "year-selection"
          ? renderYearSelection()
          : renderEmployeeTable()}
      </CardContent>
    </Card>
  );
};

export default P9AReports;
