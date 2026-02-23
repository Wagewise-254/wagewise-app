import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

import { PayrollReportTable } from "./PayrollReportTable";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PayrollReportData {
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
  const [data, setData] = useState([]);
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
          <Avatar className="h-8 w-8 text-white bg-[#1F3A8A]">
            <AvatarFallback className="text-xs font-bold bg-[#1F3A8A]">
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
      header: "Employment Type",
      cell: ({ row }) => {
        const type = row.original.employmentType?.toLowerCase() || "";
        
        // Logic to format the display text
        let displayText = "";
        if (type.includes("primary")) {
          displayText = "Primary";
        } else if (type.includes("secondary")) {
          displayText = "Secondary";
        } else if (type.includes("consultant")) {
          displayText = "Consultant";
        } else {
          displayText = row.original.employmentType; // Fallback to original if no match
        }

        return (
          <span className="text-slate-600 font-medium">
            {displayText}
          </span>
        );
      },
    },
    {
      accessorKey: "grossPay",
      header: "Gross Pay",
      cell: ({ row }) => (
        <span className="text-emerald-600 font-medium">
          + {formatCurrency(row.original.grossPay)}
        </span>
      ),
    },
     {
      accessorKey: "paye",
      header: "PAYE",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {formatCurrency(row.original.paye)}
        </span>
      ),
    },
     {
      accessorKey: "nssf",
      header: "NSSF",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {formatCurrency(row.original.nssf)}
        </span>
      ),
    },
     {
      accessorKey: "shif",
      header: "SHIF",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {formatCurrency(row.original.shif)}
        </span>
      ),
    },
     {
      accessorKey: "housingLevy",
      header: "Housing Levy",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {formatCurrency(row.original.housingLevy)}
        </span>
      ),
    },
     {
      accessorKey: "otherDeductions",
      header: "Other Deductions",
      cell: ({ row }) => (
        <span className="text-slate-700 font-medium">
          {formatCurrency(row.original.otherDeductions)}
        </span>
      ),
    },
     {
      accessorKey: "totalDeductions",
      header: "Total Deductions",
      cell: ({ row }) => (
        <span className="text-rose-600 font-medium">
          - {formatCurrency(row.original.totalDeductions)}
        </span>
      ),
    },
    {
      accessorKey: "netPay",
      header: "Net Pay",
      cell: ({ row }) => (
        <span className="text-slate-700 font-bold">
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
