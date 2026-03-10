import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import { API_BASE_URL } from "@/config";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CheckCircle2, CircleDashed, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PayrollReportData {
  id: string;
  reviewId: string;
  myStatus: string;
  employeeId: string;
  fullName: string;
  jobTitle: string;
  department: string;
  basicSalary: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  paymentMethod: string;
  reviewStatus: string;
}

interface ApiResponseItem {
  id: string;
  reviewId: string;
  employeeId: string;
  fullName: string;
  jobTitle: string;
  department: string;
  basicSalary: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  paymentMethod: string;
  reviewStatus: string;
  myStatus: string;
  // Add any other fields that come from the API
}

const toProperCase = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const EmployeeStatusBadge = ({ status }: { status: string }) => {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };
  return (
    <Badge variant="outline" className={`${getVariant(status)} font-medium`}>
      {status}
    </Badge>
  );
};

export default function PayrollApprovalTable() {
  const { companyId, payrollRunId } = useParams();
  const [data, setData] = useState<PayrollReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { session } = useAuthStore();

  const fetchData = useCallback(async () => {
    if (!companyId || !payrollRunId) return;
    setLoading(true);
    try {
      const response = await axios.get<ApiResponseItem[]>(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/${payrollRunId}/prepare`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      // Ensure each item has a reviewId (you might need to map based on actual response)
      const mappedData = response.data.map((item: ApiResponseItem) => ({
        ...item,
        reviewId: item.reviewId || item.id,
      }));

      setData(mappedData);
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, [companyId, payrollRunId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

// In the handleBulkApprove function, update this part:

const handleBulkApprove = async () => {
  // Get the selected row IDs from the table (these are the IDs from getRowId)
  const selectedRowIds = Object.keys(rowSelection).filter(
    (key) => rowSelection[key],
  );

  if (selectedRowIds.length === 0) return;

  setBulkActionLoading(true);
  const loadingToast = toast.loading(
    `Approving ${selectedRowIds.length} items...`,
  );

  try {
    // Map the selected row IDs to review IDs by finding matching rows
    const selectedReviewIds = data
      .filter(item => selectedRowIds.includes(item.reviewId) || 
                      selectedRowIds.includes(item.id) ||
                      selectedRowIds.includes(item.employeeId))
      .map(item => item.reviewId)
      .filter(id => !!id);

    if (selectedReviewIds.length === 0) {
      toast.dismiss(loadingToast);
      toast.error("No valid review IDs found for selected items");
      setBulkActionLoading(false);
      return;
    }

    await axios.post(
      `${API_BASE_URL}/company/${companyId}/payroll/reviews/bulk`,
      {
        reviewIds: selectedReviewIds,
        status: "APPROVED",
      },
      { headers: { Authorization: `Bearer ${session?.access_token}` } },
    );

    toast.dismiss(loadingToast);
    toast.success(`${selectedReviewIds.length} items approved successfully`);
    setRowSelection({}); // Clear checkboxes
    fetchData(); // Refresh list
  } catch (error) {
    toast.dismiss(loadingToast);
    console.error("Bulk approval error:", error);
    if (axios.isAxiosError(error)) {
      toast.error(error.response?.data?.error || "Failed to bulk approve items");
    } else {
      toast.error("Failed to bulk approve items");
    }
  } finally {
    setBulkActionLoading(false);
  }
};

 const handleStatusUpdate = useCallback(async (reviewId: string, newStatus: string) => {
  if (!reviewId) {
    toast.error("Invalid review ID");
    return;
  }

    setUpdatingId(reviewId);
    try {
      await axios.patch(
        `${API_BASE_URL}/company/${companyId}/payroll/reviews/${reviewId}`,
        { status: newStatus.toUpperCase() },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      toast.success(`Item marked as ${newStatus.toLowerCase()}`);
      fetchData();
    } catch (error: unknown) {
      console.error("Update error:", error);
      // Type guard to check if error is an Axios error
  if (axios.isAxiosError(error)) {
    toast.error(error.response?.data?.error || "Failed to update status");
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error("An unknown error occurred");
  }
    } finally {
      setUpdatingId(null);
    }
  }, [companyId, session, fetchData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const columns: ColumnDef<PayrollReportData>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            className="border border-slate-300 shadow-none rounded-sm"
            aria-label="Select all"
          />
        ),
       cell: ({ row }) => {
        // Get the original data for this row
        const original = row.original;
        
        // Check if this item is already approved/rejected
        const isDisabled = 
          original.myStatus === "APPROVED" || 
          original.myStatus === "REJECTED";
        
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            className="border border-slate-300 shadow-none rounded-sm"
            aria-label="Select row"
            disabled={isDisabled}
          />
        );
      },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "fullName",
        header: "Employee",
        cell: ({ row }) => {
          const status = row.original.myStatus;
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8">
                {status === "APPROVED" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                {status === "REJECTED" && (
                  <XCircle className="h-5 w-5 text-rose-500" />
                )}
                {status === "PENDING" && (
                  <CircleDashed className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">
                  {row.original.fullName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {row.original.jobTitle}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => (
          <span className="text-slate-600 font-medium">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "basicSalary",
        header: "Basic Salary",
        cell: ({ row }) => (
          <span className="text-slate-700 font-medium">
            {formatCurrency(row.original.basicSalary)}
          </span>
        ),
      },
      {
        accessorKey: "grossPay",
        header: "Gross Pay",
        cell: ({ row }) => (
          <span className="text-slate-700 font-semibold">
            {formatCurrency(row.original.grossPay)}
          </span>
        ),
      },
      {
        accessorKey: "totalDeductions",
        header: "Deductions",
        cell: ({ row }) => (
          <span className="text-rose-600 font-medium">
            -{formatCurrency(row.original.totalDeductions)}
          </span>
        ),
      },
      {
        accessorKey: "netPay",
        header: "Net Pay",
        cell: ({ row }) => (
          <span className="text-slate-700 font-semibold">
            {formatCurrency(row.original.netPay)}
          </span>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: "Pay via",
        cell: ({ row }) => (
          <span className="text-slate-600 ">
            {toProperCase(row.original.paymentMethod)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <EmployeeStatusBadge
            status={toProperCase(row.original.reviewStatus)}
          />
        ),
      },
      {
        id: "approval",
        header: "Actions",
        cell: ({ row }) => {
          const { reviewId, myStatus } = row.original;

          if (!reviewId) {
            console.log("No reviewId for row:", row.original);
            return (
              <span className="text-xs text-muted-foreground">
                No review ID
              </span>
            );
          }

          const isUpdating = updatingId === reviewId;

          return (
            <Select
              onValueChange={(value) => handleStatusUpdate(reviewId, value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-35 border rounded-sm shadow-none border-slate-300 bg-white hover:bg-slate-50 h-8">
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Update Status" />
                )}
              </SelectTrigger>
              <SelectContent>
                {myStatus !== "APPROVED" && (
                  <SelectItem
                    value="approved"
                    className="text-emerald-600 font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </div>
                  </SelectItem>
                )}
                {myStatus !== "PENDING" && (
                  <SelectItem
                    value="pending"
                    className="text-amber-600 font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <CircleDashed className="h-4 w-4" />
                      Pending
                    </div>
                  </SelectItem>
                )}
                {myStatus !== "REJECTED" && (
                  <SelectItem
                    value="rejected"
                    className="text-rose-600 font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Reject
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          );
        },
      },
    ],
    [updatingId, handleStatusUpdate],
  );

  // Calculate selected count
  const selectedCount = Object.keys(rowSelection).filter(
    (key) => rowSelection[key],
  ).length;

  return (
    <div className="p-1 space-y-4">
      {/* 3. Bulk Action Header */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-blue-800">
            <Badge variant="secondary" className="bg-blue-200 text-blue-800">
              {selectedCount}
            </Badge>
            <span className="text-sm font-medium">Items Selected</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
              disabled={bulkActionLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleBulkApprove}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Approve All Selected
            </Button>
          </div>
        </div>
      )}

      <PayrollReportTable
        columns={columns}
        data={data}
        loading={loading}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
