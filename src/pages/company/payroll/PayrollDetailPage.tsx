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
import { MoreHorizontal, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  total_deductions: number;
  gross_pay: number;
  net_pay: number;
}

const PayrollDetailsPage = () => {
  const { session } = useAuthStore();
  const { companyId, runId } = useParams<{ companyId: string; runId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<PayrollDetail[]>([]);
  const [loading, setLoading] = useState(true);

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
      setDetails(data);
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
  } catch (error: unknown) {
    console.error("Error downloading payslip:", error);
    toast.error((error as Error).message || "Error downloading payslip");
  }
};

  
  // New function to handle email payslip, showing a toast message
  const handleEmailPayslip = () => {
      toast.info("Email functionality is coming soon.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-md shadow-md">
        <Loader2 className="mr-2 animate-spin " />
        <span>Loading payroll details...</span>
      </div>
    );
  }

  if (details.length === 0) {
    return <div className="text-gray-500">No payroll details found for this run.</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payroll Details</CardTitle>
        <CardDescription>
          Details for payroll run: **{runId}**
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => navigate(-1)} className="mb-4 bg-[#7F5EFD] cursor-pointer">
          &larr; Back to Payroll Runs
        </Button>
        <Separator className="mb-4" />
        <Table>
          <TableHeader>
            <TableRow>
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
            {details.map((detail) => (
              <TableRow key={detail.id}>
                <TableCell className="font-medium">
                  {detail.employee.first_name} {detail.employee.last_name}
                </TableCell>
                <TableCell>KSh {detail.basic_salary.toFixed(2)}</TableCell>
                <TableCell>KSh {detail.total_allowances.toFixed(2)}</TableCell>
                <TableCell>KSh {detail.total_deductions.toFixed(2)}</TableCell>
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
                      {/* Attach the new click handler to the download button */}
                      <DropdownMenuItem onClick={() => handleDownloadPayslip(detail.id)}>Download Payslip</DropdownMenuItem>
                      {/* Attach the new click handler to the email button */}
                      <DropdownMenuItem onClick={handleEmailPayslip}>Email Payslip</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PayrollDetailsPage;