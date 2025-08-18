// src/pages/company/payroll/PayRunSection.tsx

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { useParams, useNavigate } from "react-router-dom";
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
  format,
  parseISO
} from 'date-fns';

interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
  payroll_date: string;
  status: string;
  total_net_pay: number;
}

const PayRunSection = () => {
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayrollRuns = useCallback(async () => {
    if (!companyId || !session) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/runs`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
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

  const handleCompleteRun = useCallback(async (runId: string) => {
    if (!companyId || !session) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/complete/${runId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete payroll run.");
      }
      toast.success("Payroll run completed successfully.");
      fetchPayrollRuns(); // Refresh the list
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    }
  }, [companyId, session, fetchPayrollRuns]);

  const handleCancelRun = useCallback(async (runId: string) => {
    if (!companyId || !session) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/cancel/${runId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel payroll run.");
      }
      toast.success("Payroll run cancelled successfully.");
      fetchPayrollRuns(); // Refresh the list
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    }
  }, [companyId, session, fetchPayrollRuns]);

  const handleViewDetails = (runId: string) => {
    navigate(`/company/${companyId}/payroll/pay-runs/${runId}`);
  };

  if (loading) {
    return <div>Loading payroll runs...</div>;
  }

  if (payrollRuns.length === 0) {
    return <div className="text-gray-500">No payroll runs found.</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Payroll Runs</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payroll Number</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Net Pay</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrollRuns.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="font-medium">
                {run.payroll_number}
              </TableCell>
              <TableCell>
                {run.payroll_month}, {run.payroll_year}
              </TableCell>
              <TableCell>{format(parseISO(run.payroll_date), 'dd/MM/yyyy')}</TableCell>
              <TableCell>KSh {run.total_net_pay.toFixed(2)}</TableCell>
              <TableCell>{run.status}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(run.id)}>
                      View Details
                    </DropdownMenuItem>
                    {run.status === "Draft" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleCompleteRun(run.id)}
                        >
                          Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCancelRun(run.id)}
                        >
                          Cancel
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PayRunSection;