// PayrollPreparationOverview.tsx
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface PayrollReportData {
  id: string;
  employeeId: string;
  fullName: string;
  jobTitle: string;
  department: string;
  email: string;
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

export default function PayrollPayslipTable() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const { companyId, payrollRunId } = useParams();
  const [data, setData] = useState<PayrollReportData[]>([]);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { session } = useAuthStore();

  // Calculate selected items based on the selection state
 const selectedItems = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => data[Number(index)])
      .filter(Boolean); // Filter out any undefined items
  }, [rowSelection, data]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/company/${companyId}/payroll/runs/${payrollRunId}/prepare`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          },
        );

        // FILTER LOGIC:
        const approvedPayments = response.data.filter(
          (item: PayrollReportData) => item.reviewStatus === "APPROVED",
        );
        setData(approvedPayments);
        setRowSelection({}); // Reset selection when data changes
      } catch (error) {
        console.error("Error fetching earnings data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId, payrollRunId, session]);

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // function to handle payslip preview
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
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send payslip email.");
      }

      const resData = await response.json();
      toast.success(resData.message || "Payslip email sent successfully.", {
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
 const handleEmailBulkPayslips = async (itemsToEmail: PayrollReportData[]) => {
    if (itemsToEmail.length === 0) {
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

    const toastId = toast.loading(`Sending emails to ${itemsToEmail.length} employees...`);

    try {
      for (const item of itemsToEmail) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/company/${companyId}/payroll/payslip/${item.id}/email`,
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
              `Failed to send email for ID ${item.id}:`,
              errorData.error,
            );
          }
        } catch (error) {
          failCount++;
          console.error(`Error sending email for ID ${item.id}:`, error);
        }
      }

      // Final toast message
      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully sent all ${successCount} emails.`, { id: toastId });
      } else if (successCount > 0) {
        toast.warning(`Sent ${successCount} emails. Failed ${failCount}.`, { id: toastId });
      } else {
        toast.error("Failed to send any emails.", { id: toastId });
      }
    } finally {
      setIsBulkSending(false);
      setRowSelection({}); // Clear selection after the operation
    }
  };

  const columns: ColumnDef<PayrollReportData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-o.5 shadow-none cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5 shadow-none cursor-pointer "
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "fullName",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-slate-50 text-slate-600">
            <AvatarFallback className="text-xs font-bold">
              {getInitials(row.original.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">
              {row.original.fullName}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.jobTitle}
            </span>
          </div>
        </div>
      ),
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
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-slate-600 font-medium">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <EmployeeStatusBadge status={toProperCase(row.original.reviewStatus)} />
      ),
    },
    {
      id: "view payslip",
      cell: ({ row }) => {
        return (
          <button
            onClick={() => handlePreviewPdf(row.original.id)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline cursor-pointer"
          >
            View Payslip
          </button>
        );
      },
    },
    {
      id: "send payslip",
      cell: ({ row }) => {
        return (
          <Button
            onClick={() => handleEmailSinglePayslip(row.original.id)}
            className="bg-[#1F3A8A] text-white hover:bg-[#1F3A8A]/90 cursor-pointer text-sm font-medium rounded-sm"
          >
            Send Payslip
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* 2. SHOW BULK BUTTON CONDITIONALLY */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-semibold text-slate-900">
          Payroll Payslips
        </h2>

        {selectedItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEmailBulkPayslips(selectedItems)}
            className="text-blue-600 border-blue-200 cursor-pointer hover:bg-blue-50 shadow-none h-9"
         >
            {isBulkSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Send {selectedItems.length} Payslip{selectedItems.length > 1 ? "s" : ""}
          </Button>
        )}
      </div>
      <PayrollReportTable
        columns={columns}
        data={data}
        loading={loading}
        options={{
          state: { rowSelection },
          onRowSelectionChange: setRowSelection,
          getRowId: ( _row: PayrollReportData, index: number) => index.toString(),
        }}
      />
    </div>
  );
}
