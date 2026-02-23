// PayrollPreparationOverview.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { API_BASE_URL } from "@/config";

interface BankDetail {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  branchName: string;
  branchCode: string;
}

interface PayrollReportData {
  fullName: string;
  paymentMethod: string;
  jobTitle: string;
  companyAccountNumber: string;
  bankDetails: BankDetail;
  netPay: number;
  reviewStatus: string;
}

const toProperCase = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function PayrollPaymentTable() {
  const { companyId, payrollRunId } = useParams();
  const [data, setData] = useState<PayrollReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuthStore();

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
          (item: PayrollReportData) => item.reviewStatus === "APPROVED"
        );
        setData(approvedPayments);
      } catch (error) {
        console.error("Error fetching earnings data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId, payrollRunId, session]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: ColumnDef<PayrollReportData>[] = [
    {
      accessorKey: "fullName",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
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
      accessorKey: "paymentMethod",
      header: "Pay via",
      cell: ({ row }) => (
        <span className="text-slate-500 text-xs ">
          <Badge variant="outline" className="text-xs border-slate-300 ">
            {toProperCase(row.original.paymentMethod)}
          </Badge>
        </span>
      ),
    },
    {
      accessorKey: "companyAccountNumber",
      header: "Company Acc No.",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {row.original.companyAccountNumber}
        </span>
      ),
    },
    {
      accessorKey: "bankDetails.accountNumber",
      header: "Employee Acc No.",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {row.original.bankDetails.accountNumber || "-"}
        </span>
      ),
    },
    {
      accessorKey: "bankDetails.accountName",
      header: "Employee Acc Name",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {row.original.bankDetails.accountName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "bankDetails.bankName",
      header: "Bank Name",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {row.original.bankDetails.bankName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "bankDetails.bankCode",
      header: "Bank Code",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {row.original.bankDetails.bankCode || "-"}
        </span>
      ),
    },
    {
      accessorKey: "bankDetails.branchName",
      header: "Branch Name",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {row.original.bankDetails.branchName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "bankDetails.branchCode",
      header: "Branch Code",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {row.original.bankDetails.branchCode || "-"}
        </span>
      ),
    },
    {
      accessorKey: "netPay",
      header: "Net Pay",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {formatCurrency(row.original.netPay)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-1">
      <PayrollReportTable columns={columns} data={data} loading={loading} />
    </div>
  );
}
