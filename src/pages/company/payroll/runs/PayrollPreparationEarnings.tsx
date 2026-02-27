import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef } from "@tanstack/react-table"; // Removed unused Row import
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
}

// Define a proper type for the row data
//type EarningRow = { original: PayrollEarningData};

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
          reportData.forEach(emp => {
            emp.allowances_details?.forEach(allow => {
              allowanceCounts[allow.name] = (allowanceCounts[allow.name] || 0) + 1;
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
      header: () => (
        <div className="text-right">Basic Salary</div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          <span className="text-slate-700">
            {formatNumber(row.original.basicSalary)}
          </span>
        </div>
      ),
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
          <div className="text-right">
            {value > 0 ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono">
                +{formatNumber(value)}
              </Badge>
            ) : (
              <span className="text-slate-300">-</span>
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
          <div className="text-right">
            {value > 0 ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-mono">
                +{formatNumber(value)}
              </Badge>
            ) : (
              <span className="text-slate-300">-</span>
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
          <div className="text-right">
            {value > 0 ? (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-mono">
                +{formatNumber(value)}
              </Badge>
            ) : (
              <span className="text-slate-300">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "grossPay",
      header: () => (
        <div className="text-right font-bold">Total Earnings</div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
            {formatNumber(row.original.grossPay)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="p-1">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Earnings Breakdown
        </h2>
        {dynamicColumns.length > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Top {dynamicColumns.length} allowances shown
          </Badge>
        )}
      </div>
      <PayrollReportTable columns={columns} data={data} loading={loading} />
    </div>
  );
}