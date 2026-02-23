import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef, Row} from "@tanstack/react-table";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AllowanceDetail {
  name: string;
  value: number;
  is_cash: boolean;
  is_taxable: boolean;
  code: string;
}

interface PayrollEarningData {
  fullName: string;
  jobTitle: string;
  basicSalary: number;
  grossPay: number;
  allowances_details: AllowanceDetail[];
  otherAllowances: number; // This is the sum of non-cash benefits from the backend
}

export default function PayrollPreparationEarnings() {
  const { companyId, payrollRunId } = useParams();
  const [data, setData] = useState<PayrollEarningData[]>([]);
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
          }
        );
        setData(response.data);
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // 1. Identify all unique Cash Allowance names across the dataset
  const cashAllowanceNames = Array.from(
    new Set(
      data.flatMap((emp) =>
        (emp.allowances_details || [])
          .filter((a) => a.is_cash)
          .map((a) => a.name)
      )
    )
  );

  // 2. Build the columns
  const columns: ColumnDef<PayrollEarningData>[] = [
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
      accessorKey: "basicSalary",
      header: "Basic Salary",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {formatNumber(row.original.basicSalary)}
        </span>
      ),
    },
    // Dynamic Cash Allowance Columns
    ...cashAllowanceNames.map((name) => ({
      id: `allowance-${name}`,
      header: name,
      cell: ({ row }: { row: Row<PayrollEarningData> }) => {
        const allowance = row.original.allowances_details?.find(
          (a: AllowanceDetail) => a.name === name && a.is_cash
        );
        const value = allowance ? allowance.value : 0;
        return (
          <span className="text-emerald-600 font-medium">
            {value > 0 ? `+${formatNumber(value)}` : "0"}
          </span>
        );
      },
    })),
    {
      accessorKey: "otherAllowances",
      header: "Non-Cash Benefits",
      cell: ({ row }) => (
        <span className="text-slate-500 italic">
          {row.original.otherAllowances > 0 
            ? formatNumber(row.original.otherAllowances) 
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "grossPay",
      header: "Total Earnings",
      cell: ({ row }) => (
        <span className="text-slate-900 font-bold">
          {formatNumber(row.original.grossPay)}
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