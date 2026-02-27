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
          }
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
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate summary stats
  const summaryStats = {
    totalGross: data.reduce((sum, item) => sum + (item.grossPay || 0), 0),
    totalNet: data.reduce((sum, item) => sum + (item.netPay || 0), 0),
    totalDeductions: data.reduce((sum, item) => sum + (item.totalDeductions || 0), 0),
    avgNet: data.length > 0 
      ? data.reduce((sum, item) => sum + (item.netPay || 0), 0) / data.length 
      : 0,
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
            <span className="font-medium text-slate-900">{row.original.fullName}</span>
            <span className="text-xs text-muted-foreground">{row.original.jobTitle}</span>
          </div>
        </div>
      )
    },
    { 
      accessorKey: "department", 
      header: "Department",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
          {row.original.department || "Unassigned"}
        </Badge>
      )
    },
    { 
      accessorKey: "basicSalary", 
      header: () => <div className="text-right">Basic</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-slate-700">
          {formatCurrency(row.original.basicSalary)}
        </div>
      )
    },
    { 
      accessorKey: "taxedBenefits", 
      header: () => <div className="text-right">Taxed</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="text-emerald-600 font-medium">
            +{formatCurrency(row.original.taxedBenefits || 0)}
          </span>
        </div>
      )
    },
    { 
      accessorKey: "nonTaxedBenefits", 
      header: () => <div className="text-right">Non-Taxed</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="text-amber-600 font-medium">
            +{formatCurrency(row.original.nonTaxedBenefits || 0)}
          </span>
        </div>
      )
    },
    { 
      accessorKey: "grossPay", 
      header: () => <div className="text-right font-bold">Gross</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold text-slate-900">
          {formatCurrency(row.original.grossPay)}
        </div>
      )
    },
    { 
      accessorKey: "totalDeductions", 
      header: () => <div className="text-right">Deductions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="text-rose-600 font-medium">
            -{formatCurrency(row.original.totalDeductions)}
          </span>
        </div>
      )
    },
    { 
      accessorKey: "netPay", 
      header: () => <div className="text-right font-bold">Net Pay</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {formatCurrency(row.original.netPay)}
          </span>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Gross Pay</p>
          <p className="text-2xl font-bold text-slate-900">KES {formatCurrency(summaryStats.totalGross)}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Net Pay</p>
          <p className="text-2xl font-bold text-emerald-600">KES {formatCurrency(summaryStats.totalNet)}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Deductions</p>
          <p className="text-2xl font-bold text-rose-600">KES {formatCurrency(summaryStats.totalDeductions)}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Avg Net per Employee</p>
          <p className="text-2xl font-bold text-indigo-600">KES {formatCurrency(summaryStats.avgNet)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Payroll Overview
        </h2>
        <PayrollCompareDialog 
          currentRunId={payrollRunId!} 
          companyId={companyId!}
        />
      </div>
      
      <PayrollReportTable columns={columns} data={data} loading={loading} />
    </div>
  );
}