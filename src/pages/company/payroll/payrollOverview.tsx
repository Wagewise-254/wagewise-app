import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Users,
  Wallet,
  FileText,
  Calendar,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/* --- Types & Interfaces --- */

interface PayrollSummary {
  payrollId: string;
  payrollMonth: string;
  payrollYear: number;
  status: string;
  employeesPaid: number;
  grossPay: number;
  netPay: number;
  statutory: number;
}

interface ChartDataItem {
  name: string;
  value: number;
}

interface DepartmentalData {
  department: string;
  netPay: number;
}

interface PayrollOverviewData {
  summary: PayrollSummary;
  breakdown: ChartDataItem[];
  statutoryDetails: ChartDataItem[];
  departmentalNetPay: DepartmentalData[];
}


// Modern, vibrant but professional color palette
const CHART_COLORS = {
  primary: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
  secondary: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"],
  accent: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  neutral: ["#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"],
};

const currency = (value: number | undefined) => {
  if (value === undefined || value === null) return "KES 0";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number | undefined) => {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat("en-KE").format(value);
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "processing":
    case "under_review":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "draft":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "approved":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "locked":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};

const PayrollOverview = () => {
  const [data, setData] = useState<PayrollOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { session } = useAuthStore();
  const { companyId } = useParams();
  const navigate = useNavigate();

  const fetchData = useCallback(
    async (showToast = false) => {
      if (!companyId || !session?.access_token) {
        setError("Missing authentication or company ID");
        setLoading(false);
        return;
      }

      try {
        setError(null);
        if (!showToast) setLoading(true);

        const res = await fetch(
          `${API_BASE_URL}/company/${companyId}/payroll/runs/latest-overview`,
          {
            headers: { Authorization: `Bearer ${session?.access_token}` },
          },
        );

        if (!res.ok) {
          if (res.status === 404) {
            setData(null);
            return;
          }
          throw new Error(`Failed to fetch overview: ${res.status}`);
        }

        const result = await res.json();
        setData(result);

        if (showToast) {
          toast.success("Payroll overview refreshed");
        }
      } catch (err) {
        console.error("Error fetching payroll overview:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
        toast.error("Failed to load payroll overview");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [companyId, session?.access_token],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  const handleRetry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Memoize formatted values to prevent recalculation
  const formattedValues = useMemo(() => {
    if (!data) return null;
    return {
      employeesPaid: formatNumber(data.summary.employeesPaid),
      grossPay: currency(data.summary.grossPay),
      netPay: currency(data.summary.netPay),
      statutory: currency(data.summary.statutory),
    };
  }, [data]);

  if (loading) {
    return <PayrollOverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4 m-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => navigate(`/company/${companyId}/modules`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-3 w-3 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/company/${companyId}/payroll/history`)
                }
              >
                View Payroll History
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-12 text-center">
        <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <FileText className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-3">
          No Payroll Data Available
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-8">
          There are no completed payroll runs to display. Complete a payroll run
          to see the overview and analytics.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate(`/company/${companyId}/payroll/run`)}
            className="bg-[#1F3A8A] hover:bg-[#162a63]"
          >
            Run New Payroll
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/company/${companyId}/payroll/history`)}
          >
            View Payroll History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 m-4 pb-8">
      {/* Header with refresh button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-1 bg-linear-to-b from-blue-600 to-blue-400 rounded-full" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
              Payroll Overview
              <span className="text-sm font-normal text-slate-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {data.summary.payrollMonth} {data.summary.payrollYear}
              </span>
            </h2>
            <p className="text-sm text-slate-500">
              Summary of payroll costs and distributions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full",
              getStatusColor(data.summary.status),
            )}
          >
            {data.summary.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* KPI Cards with improved styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Employees Paid"
          value={formattedValues?.employeesPaid || "0"}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          description="Total employees in this payroll"
        />
        <StatCard
          title="Gross Pay"
          value={formattedValues?.grossPay || "KES 0"}
          icon={<Wallet className="h-5 w-5 text-emerald-600" />}
          description="Total earnings before deductions"
          trend={`${(((data.summary.grossPay - data.summary.netPay) / data.summary.grossPay) * 100).toFixed(1)}% deductions`}
        />
        <StatCard
          title="Net Pay"
          value={formattedValues?.netPay || "KES 0"}
          icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
          description="Take-home pay after deductions"
        />
        <StatCard
          title="Statutory Deductions"
          value={formattedValues?.statutory || "KES 0"}
          icon={<FileText className="h-5 w-5 text-amber-600" />}
          description="PAYE, NSSF, SHIF, Housing Levy"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Payroll Cost Breakdown"
          subtitle="Distribution of payroll costs"
        >
          <DonutChart data={data.breakdown} colors={CHART_COLORS.primary} />
        </ChartCard>

        <ChartCard
          title="Statutory Deductions"
          subtitle="Breakdown by deduction type"
        >
          <DonutChart
            data={data.statutoryDetails}
            colors={CHART_COLORS.secondary}
          />
        </ChartCard>

        <ChartCard
          title="Net Pay by Department"
          subtitle="Department-wise distribution"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.departmentalNetPay}
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              barGap={8}
              barSize={32}
            >
              <XAxis
                dataKey="department"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
             <Tooltip formatter={(v) => currency(Number(v))} />
              <Bar dataKey="netPay" radius={[4, 4, 0, 0]}>
                {data.departmentalNetPay.map(
                  (entry: DepartmentalData, i: number) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={
                        entry.netPay > 0
                          ? CHART_COLORS.accent[i % CHART_COLORS.accent.length]
                          : "#e2e8f0"
                      }
                    />
                  ),
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {data.departmentalNetPay.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <p className="text-sm text-slate-400">
                No department data available
              </p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/company/${companyId}/payroll/history`)}
        >
          View All Payrolls
        </Button>
        <Button
          size="sm"
          className="bg-[#1F3A8A] hover:bg-[#162a63]"
          onClick={() => navigate(`/company/${companyId}/payroll/run`)}
        >
          Run New Payroll
        </Button>
      </div>
    </div>
  );
};

/* ---------- Helpers ---------- */

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard = ({
  title,
  value,
  icon,
  description,
  trend,
  trendUp,
}: StatCardProps) => (
  <Card className="rounded-sm border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md">
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-sm font-medium text-slate-600">
        {title}
      </CardTitle>
      {icon && (
        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
      )}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
      {trend && (
        <p
          className={cn(
            "text-xs mt-2 flex items-center gap-1",
            trendUp ? "text-emerald-600" : "text-amber-600",
          )}
        >
          {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

const ChartCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <Card className="rounded-sm border border-slate-200 overflow-hidden hover:border-slate-300 transition-all hover:shadow-md">
    <CardHeader className="bg-linear-to-r from-slate-50 to-white border-b border-slate-100 pb-3">
      <CardTitle className="text-sm font-semibold text-slate-800">
        {title}
      </CardTitle>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </CardHeader>
    <CardContent className="pt-4 px-3 relative min-h-80">
      {children}
    </CardContent>
  </Card>
);

interface DonutChartProps {
  data: ChartDataItem[];
  colors?: string[];
}

const DonutChart = ({
  data,
  colors = CHART_COLORS.neutral,
}: DonutChartProps) => {
  // Filter out zero values to avoid empty slices
  const filteredData = data.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="h-70 flex items-center justify-center">
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filteredData}
          innerRadius={65}
          outerRadius={90}
          dataKey="value"
          paddingAngle={3}
          cornerRadius={4}
        >
          {filteredData.map((_, i: number) => (
            <Cell
              key={`cell-${i}`}
              fill={colors[i % colors.length]}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip formatter={(v) => currency(Number(v))} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-xs text-slate-600">{value}</span>
          )}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const PayrollOverviewSkeleton = () => (
  <div className="space-y-6 m-4 pb-8">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-10 w-1 rounded-full" />
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-9 w-24 rounded" />
    </div>

    {/* KPI Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="rounded-lg border border-slate-200">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="rounded-lg border border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-48 mt-1" />
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default PayrollOverview;
