// src/pages/company/payroll/PayrollDetailsPage.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2, Mail, Download, FileText } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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

interface PayrollDetail {
  id: string;
  employee: {
    first_name: string;
    last_name: string;
    employee_number: string;
    email: string;
  };
  basic_salary: number;
  total_allowances: number;
  total_non_cash_benefits: number;
  total_deductions: number;
  gross_pay: number;
  net_pay: number;
}

const PayrollDetailsPage = () => {
  const { session } = useAuthStore();
  const { companyId, runId } = useParams<{
    companyId: string;
    runId: string;
  }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<PayrollDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isBulkSending, setIsBulkSending] = useState(false);

  // Sort payroll details by employee name
const sortDetails = (data: PayrollDetail[]): PayrollDetail[] => {
  return [...data].sort((a, b) => {
    const nameA = `${a.employee.first_name} ${a.employee.last_name}`;
    const nameB = `${b.employee.first_name} ${b.employee.last_name}`;
    return nameA.localeCompare(nameB); // Ascending alphabetical sort
  });
};

  const fetchPayrollDetails = useCallback(async () => {
    if (!companyId || !runId || !session) {
      toast.error("Invalid request parameters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/${runId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch payroll details.");
      }
      const sortedData = sortDetails(data);
      setDetails(sortedData);
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [companyId, runId, session]);

  useEffect(() => {
    fetchPayrollDetails();
  }, [fetchPayrollDetails]);

  // New function to handle payslip preview
  const handlePreviewPdf = (payrollDetailId: string) => {
    if (!companyId || !session) {
      toast.error("Authentication token is missing. Please log in again.");
      return;
    }

    // Construct the preview URL
    const pdfUrl = `${API_BASE_URL}/company/${companyId}/payroll/payslip/${payrollDetailId}/download?preview=true&token=${session.access_token}`;

    // Open the preview URL in a new tab
    window.open(pdfUrl, "_blank");
  };

  // New function to handle payslip download
  const handleDownloadPayslip = async (payrollDetailId: string) => {
    if (!companyId || !session) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/payslip/${payrollDetailId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download payslip.");
      }

      // Grab filename from Content-Disposition header if backend sends it
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "payslip.pdf";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // Turn response into blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Payslip for downloaded successfully.`);
    } catch (error: unknown) {
      console.error("Error downloading payslip:", error);
      toast.error((error as Error).message || "Error downloading payslip");
    }
  };

  // New function to handle single payslip email
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
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send payslip email.");
      }

      const data = await response.json();
      toast.success(data.message || "Payslip email sent successfully.", {
        id: toastId,
      });
    } catch (error: unknown) {
      console.error("Error emailing payslip:", error);
      toast.error((error as Error).message || "Error sending payslip email.", {
        id: toastId,
      });
    }
  };

  // New function to handle bulk payslip email
  const handleEmailBulkPayslips = async () => {
    if (selectedEmployees.length === 0) {
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
      `Sending emails to ${selectedEmployees.length} employees...`
    );

    try {
      for (const id of selectedEmployees) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/company/${companyId}/payroll/payslip/${id}/email`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            const errorData = await response.json();
            console.error(
              `Failed to send email for ID ${id}:`,
              errorData.error
            );
          }
        } catch (error) {
          failCount++;
          console.error(`Error sending email for ID ${id}:`, error);
        }
      }

      // Final toast message
      if (successCount > 0 && failCount === 0) {
        toast.success(
          `Successfully sent emails to all ${successCount} selected employees.`,
          { id: toastId }
        );
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `Sent emails to ${successCount} employees. Failed to send to ${failCount} employees.`,
          { id: toastId }
        );
      } else {
        toast.error("Failed to send any emails.", { id: toastId });
      }
    } finally {
      setIsBulkSending(false);
      setSelectedEmployees([]); // Clear selection after the operation
    }
  };
  // Pagination and search logic
  const filteredDetails = details.filter(
    (detail) =>
      `${detail.employee.first_name} ${detail.employee.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      detail.employee.employee_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDetails.length / itemsPerPage);
  const paginatedDetails = filteredDetails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredDetails.map((d) => d.id);
      setSelectedEmployees(allIds);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (payrollDetailId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees((prev) => [...prev, payrollDetailId]);
    } else {
      setSelectedEmployees((prev) =>
        prev.filter((id) => id !== payrollDetailId)
      );
    }
  };

  const isAllSelected =
    selectedEmployees.length > 0 &&
    selectedEmployees.length === filteredDetails.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-md shadow-md">
        <Loader2 className="mr-2 animate-spin " />
        <span>Loading payroll details...</span>
      </div>
    );
  }

  if (details.length === 0) {
    return (
      <div className="text-gray-500">
        No payroll details found for this run.
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payroll Details</CardTitle>
        <CardDescription>Details for payroll run: **{runId}**</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button
            onClick={() => navigate(-1)}
            className="bg-[#7F5EFD] cursor-pointer"
          >
            &larr; Back to Payroll Runs
          </Button>
          <div className="flex gap-2">
            <Input
              placeholder="Search for employees"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            {selectedEmployees.length > 0 && (
              <Button
                onClick={handleEmailBulkPayslips}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isBulkSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>Send Payslip Email ({selectedEmployees.length})</>
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="border rounded-md px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Gross Pay</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDetails.map((detail) => (
                <TableRow key={detail.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.includes(detail.id)}
                      onCheckedChange={(checked: boolean) =>
                        handleSelectEmployee(detail.id, checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {detail.employee.first_name} {detail.employee.last_name}
                  </TableCell>
                  <TableCell>KSh {detail.basic_salary.toFixed(2)}</TableCell>
                  <TableCell>
                    KSh{" "}
                    {(
                      detail.total_allowances + detail.total_non_cash_benefits
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    KSh {detail.total_deductions.toFixed(2)}
                  </TableCell>
                  <TableCell>KSh {detail.gross_pay.toFixed(2)}</TableCell>
                  <TableCell>KSh {detail.net_pay.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDownloadPayslip(detail.id)}
                        >
                          <Download className="mr-2 h-4 w-4" /> Download Payslip
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEmailSinglePayslip(detail.id)}
                        >
                          <Mail className="mr-2 h-4 w-4" /> Email Payslip
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePreviewPdf(detail.id)}
                        >
                          <FileText className="mr-2 h-4 w-4" /> Preview Payslip
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    isActive={currentPage === index + 1}
                    onClick={() => setCurrentPage(index + 1)}
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
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayrollDetailsPage;
