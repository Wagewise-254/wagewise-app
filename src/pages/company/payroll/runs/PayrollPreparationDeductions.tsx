import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
      header: () => <div className="text-right">Gross Pay</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-slate-700">
          {formatCurrency(row.original.grossPay)}
        </div>
      ),
    },
    {
      accessorKey: "paye",
      header: () => <div className="text-right">PAYE</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-mono">
            {formatCurrency(row.original.paye)}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "nssf",
      header: () => <div className="text-right">NSSF</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-slate-700">
          {formatCurrency(row.original.nssf)}
        </div>
      ),
    },
    {
      accessorKey: "shif",
      header: () => <div className="text-right">SHIF</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-slate-700">
          {formatCurrency(row.original.shif)}
        </div>
      ),
    },
    {
      accessorKey: "housingLevy",
      header: () => <div className="text-right">Housing</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-slate-700">
          {formatCurrency(row.original.housingLevy)}
        </div>
      ),
    },
    {
      accessorKey: "otherDeductions",
      header: () => <div className="text-right">Other</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-slate-700">
          {formatCurrency(row.original.otherDeductions)}
        </div>
      ),
    },
    {
      accessorKey: "totalDeductions",
      header: () => <div className="text-right font-bold">Total</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="font-bold text-rose-600">
            {formatCurrency(row.original.totalDeductions)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "netPay",
      header: () => <div className="text-right font-bold">Net Pay</div>,
      cell: ({ row }) => {
        const deductionRate = ((row.original.totalDeductions / row.original.grossPay) * 100).toFixed(1);
        return (
          <div className="text-right">
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
    <div className="p-1">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Deductions Breakdown
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Statutory and voluntary deductions per employee
        </p>
      </div>
      <PayrollReportTable columns={columns} data={data} loading={loading} />
    </div>
  );
}