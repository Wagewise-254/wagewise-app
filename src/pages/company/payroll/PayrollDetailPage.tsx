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
import { MoreHorizontal } from "lucide-react";
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

  if (loading) {
    return <div>Loading payroll details...</div>;
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
        <Button onClick={() => navigate(-1)} className="mb-4">
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
                      <DropdownMenuItem>Download Payslip</DropdownMenuItem>
                      <DropdownMenuItem>Email Payslip</DropdownMenuItem>
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