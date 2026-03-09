import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";

interface AllowanceDetail {
  name: string;
  value: number;
  is_cash: boolean;
  is_taxable: boolean;
  code: string;
}

interface PayrollEarningData {
  id: string;
  employeeId: string;
  fullName: string;
  jobTitle: string;
  basicSalary: number;
  grossPay: number;
  allowances_details: AllowanceDetail[];
  topAllowances: Record<string, number>;
  otherCashAllowances: number;
  otherAllowances: number;
  absent_days: number;
  absent_days_deduction: number;
}

export default function PayrollPreparationEarnings() {
  const { companyId, payrollRunId } = useParams();
  const [data, setData] = useState<PayrollEarningData[]>([]);
  const [dynamicColumns, setDynamicColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Add query param to indicate this is earnings view
        const response = await axios.get(
          `${API_BASE_URL}/company/${companyId}/payroll/runs/${payrollRunId}/prepare?view=earnings`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          },
        );

        // Handle both response formats
        let reportData: PayrollEarningData[] = [];
        let allowanceNames: string[] = [];

        if (response.data.data && response.data.columns) {
          // New format with columns
          reportData = response.data.data;
          allowanceNames = response.data.columns;
        } else if (Array.isArray(response.data)) {
          // Old format - just array
          reportData = response.data;
          // Calculate top allowances client-side
          const allowanceCounts: Record<string, number> = {};
          reportData.forEach((emp) => {
            emp.allowances_details?.forEach((allow) => {
              allowanceCounts[allow.name] =
                (allowanceCounts[allow.name] || 0) + 1;
            });
          });
          allowanceNames = Object.entries(allowanceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name]) => name);
        }

        setData(reportData);
        setDynamicColumns(allowanceNames);
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

  // Calculate summary stats
  const summaryStats = {
    totalBasic: data.reduce((sum, item) => sum + (item.basicSalary || 0), 0),
    totalGross: data.reduce((sum, item) => sum + (item.grossPay || 0), 0),
    totalAllowances: data.reduce((sum, item) => {
      const allowanceSum = Object.values(item.topAllowances || {}).reduce((a, b) => a + b, 0);
      return sum + allowanceSum + (item.otherCashAllowances || 0) + (item.otherAllowances || 0);
    }, 0),
    totalAbsentDeductions: data.reduce((sum, item) => sum + (item.absent_days_deduction || 0), 0),
    employeeCount: data.length,
  };

  // Build columns dynamically
  const columns: ColumnDef<PayrollEarningData>[] = [
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
      accessorKey: "basicSalary",
      header: "Basic Salary",
      cell: ({ row }) => (
        <div className="font-medium">
          <span className="text-slate-700">
            {formatNumber(row.original.basicSalary)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "absent_days_deduction",
      header: "Absent Days",
      cell: ({ row }: { row: { original: PayrollEarningData } }) => {
        const deduction = row.original.absent_days_deduction || 0;
        const days = row.original.absent_days || 0;

        if (deduction === 0) {
          return (
            <div>
              <span className="text-slate-600">0</span>
            </div>
          );
        }

        return (
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 font-mono cursor-help"
                  >
                    -{formatNumber(deduction)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {days} day{days !== 1 ? "s" : ""} absent
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    // Dynamic Cash Allowance Columns
    ...dynamicColumns.map((name) => ({
      id: `allowance-${name}`,
      header: () => (
        <TooltipProvider key={name}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dotted border-slate-300">
                {name.length > 15 ? `${name.substring(0, 12)}...` : name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }: { row: { original: PayrollEarningData } }) => {
        const value = row.original.topAllowances?.[name] || 0;
        return (
          <div>
            {value > 0 ? (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono"
              >
                +{formatNumber(value)}
              </Badge>
            ) : (
              <span className="text-slate-600">0</span>
            )}
          </div>
        );
      },
    })),
    {
      id: "other-cash-allowances",
      header: "Other Cash",
      cell: ({ row }: { row: { original: PayrollEarningData } }) => {
        const value = row.original.otherCashAllowances || 0;
        return (
          <div>
            {value > 0 ? (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 font-mono"
              >
                +{formatNumber(value)}
              </Badge>
            ) : (
              <span className="text-slate-600">0</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "otherAllowances",
      header: "Non-Cash",
      cell: ({ row }: { row: { original: PayrollEarningData } }) => {
        const value = row.original.otherAllowances || 0;
        return (
          <div>
            {value > 0 ? (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 font-mono"
              >
                +{formatNumber(value)}
              </Badge>
            ) : (
              <span className="text-slate-600">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "grossPay",
      header: "Total Earnings",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
            {formatNumber(row.original.grossPay)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Minimized Summary Stats */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="text-xs text-slate-500">Basic:</span>
              <span className="text-sm font-semibold text-slate-900">KES {formatNumber(summaryStats.totalBasic)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="text-xs text-emerald-600">Allowances:</span>
              <span className="text-sm font-semibold text-emerald-700">KES {formatNumber(summaryStats.totalAllowances)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
              <span className="text-xs text-amber-600">Gross:</span>
              <span className="text-sm font-semibold text-amber-700">KES {formatNumber(summaryStats.totalGross)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
              <span className="text-xs text-rose-600">Absent:</span>
              <span className="text-sm font-semibold text-rose-700">KES {formatNumber(summaryStats.totalAbsentDeductions)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
              <span className="text-xs text-indigo-600">Employees:</span>
              <span className="text-sm font-semibold text-indigo-700">{summaryStats.employeeCount}</span>
            </div>

            {dynamicColumns.length > 0 && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 ml-auto"
              >
                Top {dynamicColumns.length} allowances
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      <PayrollReportTable columns={columns} data={data} loading={loading} />
    </div>
  );
}