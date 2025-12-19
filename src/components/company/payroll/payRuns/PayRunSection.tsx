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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

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
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Month ordering for sorting logic
  const monthOrder: Record<string, number> = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  // 1. Sort the data: Latest Year first, then Latest Month
  const sortedRuns = [...payrollRuns].sort((a, b) => {
    if (b.payroll_year !== a.payroll_year) {
      return b.payroll_year - a.payroll_year;
    }
    return monthOrder[b.payroll_month] - monthOrder[a.payroll_month];
  });

  // 2. Paginate the sorted data
  const totalPages = Math.ceil(sortedRuns.length / pageSize);
  const paginatedRuns = sortedRuns.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

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
  //handle complete, cancel, recalculate
  const handleCompleteRun = useCallback(
    async (runId: string) => {
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
        toast.error(
          (error as Error).message || "An unexpected error occurred."
        );
      }
    },
    [companyId, session, fetchPayrollRuns]
  );

  const handleCancelRun = useCallback(
    async (runId: string) => {
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
        toast.error(
          (error as Error).message || "An unexpected error occurred."
        );
      }
    },
    [companyId, session, fetchPayrollRuns]
  );

  const handleRecalculateRun = useCallback(
    async (run: PayrollRun) => {
      if (!companyId || !session) return;
      try {
        toast.info("Recalculating payroll run...");
        const res = await fetch(
          `${API_BASE_URL}/company/${companyId}/payroll/run`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              month: run.payroll_month,
              year: run.payroll_year,
            }),
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to recalculate payroll run.");
        }
        toast.success("Payroll run recalculated successfully.");
        fetchPayrollRuns(); // Refresh the list
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          (error as Error).message || "An unexpected error occurred."
        );
      }
    },
    [companyId, session, fetchPayrollRuns]
  );

  const handleViewDetails = (runId: string) => {
    navigate(`/company/${companyId}/payroll/pay-runs/${runId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="mr-2 animate-spin " />
        <span>Loading payroll runs...</span>
      </div>
    );
  }

  if (payrollRuns.length === 0) {
    return <div className="text-gray-500">No payroll runs found.</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Payroll Runs</h2>
      <div className="rounded-md border px-2">
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
            {paginatedRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium">
                  {run.payroll_number}
                </TableCell>
                <TableCell>
                  {run.payroll_month}, {run.payroll_year}
                </TableCell>
                <TableCell>
                  {format(parseISO(run.payroll_date), "dd/MM/yyyy")}
                </TableCell>
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
                      <DropdownMenuItem
                        onClick={() => handleViewDetails(run.id)}
                      >
                        View Details
                      </DropdownMenuItem>
                      {run.status === "Draft" && (
                        <>
                          {/* Recalculate Confirmation Dialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              {/* onSelect prevents the DropdownMenu from closing when the AlertDialog is triggered */}
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                Recalculate
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirm Recalculation
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will{" "}
                                  <span className="font-bold">
                                    permanently delete
                                  </span>{" "}
                                  the existing draft payroll for{" "}
                                  <span className="font-bold">
                                    {run.payroll_month}, {run.payroll_year}
                                  </span>{" "}
                                  and create a new one. Are you sure you want to
                                  proceed?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRecalculateRun(run)}
                                >
                                  Yes, Recalculate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Complete Confirmation Dialog (NEW) */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                Complete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirm Payroll Completion
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Completing the payroll for{" "}
                                  <span className="font-bold">
                                    {run.payroll_month}, {run.payroll_year}
                                  </span>{" "}
                                  is{" "}
                                  <span className="font-bold">
                                    irreversible
                                  </span>
                                  . This will finalize all payments and
                                  statutory deductions (e.g., update HELB
                                  balances). Are you sure you want to finalize
                                  this payroll run?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Review Draft
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCompleteRun(run.id)}
                                >
                                  Yes, Complete Payroll
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Cancel Confirmation Dialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                Cancel Run
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirm Cancellation
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark the draft payroll for{" "}
                                  <span className="font-bold">
                                    {run.payroll_month}, {run.payroll_year}
                                  </span>{" "}
                                  as{" "}
                                  <span className="font-bold">Cancelled</span>.
                                  This action cannot be reversed, and you will
                                  need to create a new run for this period.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelRun(run.id)}
                                >
                                  Yes, Cancel Run
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Advanced Pagination UI */}
      <div className="flex justify-center mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                className={currentPage === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={currentPage === index}
                  onClick={() => setCurrentPage(index)}
                  className="cursor-pointer"
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                className={currentPage >= totalPages - 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default PayRunSection;
