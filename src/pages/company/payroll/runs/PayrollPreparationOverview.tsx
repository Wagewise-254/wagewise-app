import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { PayrollCompareDialog } from "@/components/payroll/runs/PayrollCompareDialog";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
//import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PayrollReportData {
  id: string;
  fullName: string;
  jobTitle: string;
  department: string;
  basicSalary: number;
  taxedBenefits: number;
  nonTaxedBenefits: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
}

export default function PayrollPreparationOverview() {
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

        // Handle both response formats
        if (response.data.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
        } else if (Array.isArray(response.data)) {
          setData(response.data);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching overview data:", error);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2, 
    }).format(value);
  };

  // Calculate summary stats
  const summaryStats = {
    totalGross: data.reduce((sum, item) => sum + (item.grossPay || 0), 0),
    totalNet: data.reduce((sum, item) => sum + (item.netPay || 0), 0),
    totalDeductions: data.reduce(
      (sum, item) => sum + (item.totalDeductions || 0),
      0,
    ),
    employeeCount: data.length,
  };

  const columns: ColumnDef<PayrollReportData>[] = [
    {
      accessorKey: "fullName",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-linear-to-br from-blue-50 to-indigo-50 text-indigo-700">
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
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-700 border-slate-200"
        >
          {row.original.department || "Unassigned"}
        </Badge>
      ),
    },
    {
      accessorKey: "basicSalary",
      header: "Basic",
      cell: ({ row }) => (
        <div className="font-medium text-slate-700">
          {formatCurrency(row.original.basicSalary)}
        </div>
      ),
    },
    {
      accessorKey: "taxedBenefits",
      header: "Taxed",
      cell: ({ row }) => (
        <div>
          <span className="text-emerald-600 font-medium">
            +{formatCurrency(row.original.taxedBenefits || 0)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "nonTaxedBenefits",
      header: "Non-Taxed",
      cell: ({ row }) => (
        <div>
          <span className="text-amber-600 font-medium">
            +{formatCurrency(row.original.nonTaxedBenefits || 0)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "grossPay",
      header: "Gross",
      cell: ({ row }) => (
        <div className="font-semibold text-slate-900">
          {formatCurrency(row.original.grossPay)}
        </div>
      ),
    },
    {
      accessorKey: "totalDeductions",
      header: "Deductions",
      cell: ({ row }) => (
        <div>
          <span className="text-rose-600 font-medium">
            -{formatCurrency(row.original.totalDeductions)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "netPay",
      header: "Net Pay",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {formatCurrency(row.original.netPay)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Minimized Summary Cards - Now as badges */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="text-xs text-slate-500">Gross:</span>
              <span className="text-sm font-semibold text-slate-900">
                KES {formatCurrency(summaryStats.totalGross)}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="text-xs text-emerald-600">Net:</span>
              <span className="text-sm font-semibold text-emerald-700">
                KES {formatCurrency(summaryStats.totalNet)}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
              <span className="text-xs text-rose-600">Deductions:</span>
              <span className="text-sm font-semibold text-rose-700">
                KES {formatCurrency(summaryStats.totalDeductions)}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
              <span className="text-xs text-indigo-600">Employees:</span>
              <span className="text-sm font-semibold text-indigo-700">
                {summaryStats.employeeCount}
              </span>
            </div>

            <div className="ml-auto">
              <PayrollCompareDialog
                currentRunId={payrollRunId!}
                companyId={companyId!}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <PayrollReportTable columns={columns} data={data} loading={loading} />
    </div>
  );
}
