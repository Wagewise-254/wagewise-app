// PayrollPreparationOverview.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import { API_BASE_URL } from "@/config";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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

const toProperCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const EmployeeStatusBadge = ({ status }: { status: string }) => {
  const getVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Rejected":
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { session } = useAuthStore();

      const fetchData = useCallback(async () => {
        if (!companyId || !payrollRunId) return;
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/company/${companyId}/payroll/runs/${payrollRunId}/prepare`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      setData(response.data);
      } catch (error) {
        console.error("Error fetching payroll data:", error);
      toast.error("Could not refresh data");
      } finally {
        setLoading(false);
      }

      
    }, [companyId, payrollRunId, session]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBulkApprove = async () => {
  if (selectedRows.length === 0) return;
  
  setBulkActionLoading(true);
  const loadingToast = toast.loading(`Approving ${selectedRows.length} items...`);
  
  try {
    await axios.post(
      `${API_BASE_URL}/company/${companyId}/payroll/reviews/bulk`,
      {
        reviewIds: selectedRows,
        status: "APPROVED",
      },
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    );
    
    toast.dismiss(loadingToast);
    toast.success(`Successfully approved ${selectedRows.length} items`);
    setSelectedRows([]);
    fetchData();
  } catch (error) {
    toast.dismiss(loadingToast);
    toast.error("Failed to bulk approve");
  } finally {
    setBulkActionLoading(false);
  }
};

  const handleStatusUpdate = async (reviewId: string, newStatus: string) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/company/${companyId}/payroll/reviews/${reviewId}`,
        { status: newStatus.toUpperCase() },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      toast.success(`Item marked as ${newStatus}`);
      fetchData(); 
    } catch (error) {
      toast.error("Failed to update status");
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: ColumnDef<PayrollReportData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
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
            {/* Status Icon Indicator instead of Avatar */}
            <div className="flex items-center justify-center h-8 w-8">
              {status === "APPROVED" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {status === "REJECTED" && <XCircle className="h-5 w-5 text-rose-500" />}
              {status === "PENDING" && <CircleDashed className="h-5 w-5 text-amber-500 animate-spin-slow" />}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">{row.original.fullName}</span>
              <span className="text-xs text-muted-foreground">{row.original.jobTitle}</span>
            </div>
          </div>
        );
      }
    },
    { 
      accessorKey: "department", 
      header: "Department",
      cell: ({ row }) => (
        <span className="text-slate-600 font-medium">{row.original.department}</span>
      )
    },
    { 
      accessorKey: "basicSalary", 
      header: "Basic Salary",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {formatCurrency(row.original.basicSalary)}
        </span>
      )
    },
    { 
      accessorKey: "grossPay", 
      header: "Gross Pay",
      cell: ({ row }) => (
        <span className="text-slate-700 font-semibold">
          {formatCurrency(row.original.grossPay)}
        </span>
      )
    },
    { 
      accessorKey: "totalDeductions", 
      header: "Deductions",
      cell: ({ row }) => (
        <span className="text-rose-600 font-medium">
          -{formatCurrency(row.original.totalDeductions)}
        </span>
      )
    },
    { 
      accessorKey: "netPay", 
      header: "Net Pay",
      cell: ({ row }) => (
        <span className="text-slate-700 font-semibold">
          {formatCurrency(row.original.netPay)}
        </span>
      )
    },
    {
      accessorKey: "paymentMethod",
      header: "Pay via",
      cell: ({ row }) => (
        <span className="text-slate-600 ">
          {toProperCase(row.original.paymentMethod)}
        </span>
      )
    },
      {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <EmployeeStatusBadge status={toProperCase(row.original.reviewStatus)} />
      )
    },
    {
      id: "approval",
      cell: ({ row }) => {
        const { reviewId, myStatus } = row.original;
        if (!reviewId) return null;

        return (
       <Select onValueChange={(value) => handleStatusUpdate(reviewId, value)}>
            <SelectTrigger className="border rounded-sm shadow-none border-slate-300 bg-white hover:bg-slate-50 h-8 px-2">
              <SelectValue placeholder="Update Status" className="text-xs" />
            </SelectTrigger>
            <SelectContent>
              {/* Conditional Rendering: Only show relevant actions */}
              {myStatus !== "APPROVED" && (
                <SelectItem value="approved" className="text-emerald-600 font-medium">
                  Approve Item
                </SelectItem>
              )}
              {myStatus !== "PENDING" && (
                <SelectItem value="pending" className="text-amber-600 font-medium">
                  Mark as Pending
                </SelectItem>
              )}
              {myStatus !== "REJECTED" && (
                <SelectItem value="rejected" className="text-rose-600 font-medium">
                  Reject Item
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )
      }
    }
  ];

  return (
    <div className="p-1"> 
{selectedRows.length > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
    <span className="text-sm text-blue-700">
      {selectedRows.length} items selected
    </span>
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setSelectedRows([])}
      >
        Clear
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
        Approve All
      </Button>
    </div>
  </div>
)}     
      <PayrollReportTable columns={columns} data={data} loading={loading} />
    </div>
  );
}