import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
//import { Progress } from "@/components/ui/progress";

interface PayrollReportData {
  id: string;
  fullName: string;
  jobTitle: string;
  employmentType: string;
  grossPay: number;
  paye: number;
  nssf: number;
  shif: number;
  housingLevy: number;
  helbDeduction: number;
  otherDeductions: number; 
  totalDeductions: number;
  netPay: number;
}

export default function PayrollPreparationDeductions() {
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
        console.error("Error fetching deductions data:", error);
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

  const getEmploymentTypeBadge = (type: string) => {
    const typeLower = type?.toLowerCase() || "";
    if (typeLower.includes("primary")) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Primary</Badge>;
    } else if (typeLower.includes("secondary")) {
      return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Secondary</Badge>;
    } else if (typeLower.includes("consultant")) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Consultant</Badge>;
    }
    return <Badge variant="outline">{type || "N/A"}</Badge>;
  };

  // Calculate summary stats
  const summaryStats = {
    totalGross: data.reduce((sum, item) => sum + (item.grossPay || 0), 0),
    totalPAYE: data.reduce((sum, item) => sum + (item.paye || 0), 0),
    totalNSSF: data.reduce((sum, item) => sum + (item.nssf || 0), 0),
    totalSHIF: data.reduce((sum, item) => sum + (item.shif || 0), 0),
    totalHousing: data.reduce((sum, item) => sum + (item.housingLevy || 0), 0),
    totalHELB: data.reduce((sum, item) => sum + (item.helbDeduction || 0), 0),
    totalOther: data.reduce((sum, item) => sum + (item.otherDeductions || 0), 0),
    totalDeductions: data.reduce((sum, item) => sum + (item.totalDeductions || 0), 0),
    totalNet: data.reduce((sum, item) => sum + (item.netPay || 0), 0),
    employeeCount: data.length,
  };

  const columns: ColumnDef<PayrollReportData>[] = [
    {
      accessorKey: "fullName",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-linear-to-br from-indigo-50 to-purple-50 text-indigo-700">
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
      accessorKey: "employmentType",
      header: "Type",
      cell: ({ row }) => getEmploymentTypeBadge(row.original.employmentType),
    },
    {
      accessorKey: "grossPay",
      header: "Gross Pay",
      cell: ({ row }) => (
        <div className="font-medium text-slate-700">
          {formatCurrency(row.original.grossPay)}
        </div>
      ),
    },
    {
      accessorKey: "paye",
      header: "PAYE",
      cell: ({ row }) => (
        <div>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-mono">
            {formatCurrency(row.original.paye)}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "nssf",
      header: "NSSF",
      cell: ({ row }) => (
        <div className="font-medium text-slate-700">
          {formatCurrency(row.original.nssf)}
        </div>
      ),
    },
    {
      accessorKey: "shif",
      header: "SHIF",
      cell: ({ row }) => (
        <div className="font-medium text-slate-700">
          {formatCurrency(row.original.shif)}
        </div>
      ),
    },
    {
      accessorKey: "housingLevy",
      header: "Housing",
      cell: ({ row }) => (
        <div className="font-medium text-slate-700">
          {formatCurrency(row.original.housingLevy)}
        </div>
      ),
    },
    {
      accessorKey: "helbDeduction",
      header: "HELB",
      cell: ({ row }) => (
        <div className="font-medium text-slate-700">
          {formatCurrency(row.original.helbDeduction)}
        </div>
      ),
    },
    {
      accessorKey: "otherDeductions",
      header: "Other",
      cell: ({ row }) => (
        <div className="font-medium text-slate-700">
          {formatCurrency(row.original.otherDeductions)}
        </div>
      ),
    },
    {
      accessorKey: "totalDeductions",
      header: "Total",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-rose-600">
            {formatCurrency(row.original.totalDeductions)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "netPay",
      header: "Net Pay",
      cell: ({ row }) => {
        const deductionRate = ((row.original.totalDeductions / row.original.grossPay) * 100).toFixed(1);
        return (
          <div>
            <span className="font-bold text-emerald-600">
              {formatCurrency(row.original.netPay)}
            </span>
            <div className="text-xs text-slate-400 mt-1">
              {deductionRate}% deducted
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Minimized Summary Stats */}
      <Card className="border-slate-200 shadow-none">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">            
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
              <span className="text-xs text-red-600">PAYE:</span>
              <span className="text-sm font-semibold text-red-700">KES {formatCurrency(summaryStats.totalPAYE)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <span className="text-xs text-blue-600">NSSF:</span>
              <span className="text-sm font-semibold text-blue-700">KES {formatCurrency(summaryStats.totalNSSF)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-cyan-50 px-3 py-1.5 rounded-full border border-cyan-100">
              <span className="text-xs text-cyan-600">SHIF:</span>
              <span className="text-sm font-semibold text-cyan-700">KES {formatCurrency(summaryStats.totalSHIF)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
              <span className="text-xs text-amber-600">Housing:</span>
              <span className="text-sm font-semibold text-amber-700">KES {formatCurrency(summaryStats.totalHousing)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
              <span className="text-xs text-purple-600">HELB:</span>
              <span className="text-sm font-semibold text-purple-700">KES {formatCurrency(summaryStats.totalHELB)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
              <span className="text-xs text-rose-600">Total Ded:</span>
              <span className="text-sm font-semibold text-rose-700">KES {formatCurrency(summaryStats.totalDeductions)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="text-xs text-emerald-600">Net:</span>
              <span className="text-sm font-semibold text-emerald-700">KES {formatCurrency(summaryStats.totalNet)}</span>
            </div>
            
          </div>
        </CardContent>
      </Card>
      
      
      <PayrollReportTable columns={columns} data={data} loading={loading} />
    </div>
  );
}