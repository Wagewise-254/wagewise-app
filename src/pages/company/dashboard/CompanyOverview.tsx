import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  totalEmployees: number;
  activeEmployees: number;
  availableYears: number[];
  selectedYear: number;
  payrollMonthly: Array<{
    month: string;
    gross_pay: number;
    total_deductions: number;
    net_pay: number;
  }>;
  departments: Array<{ id: string; name: string; employeeCount: number }>;
  recentPayrolls: Array<{ payroll_number: string; payroll_date: string; total_net_pay: number }>;

}

interface PayrollTooltipItem {
  dataKey: string;
  value: number;
}

interface PayrollTooltipProps {
  active?: boolean;
  payload?: PayrollTooltipItem[];
  label?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const currency = (val: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(val || 0);

interface PayrollTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}

const PayrollTooltip: React.FC<PayrollTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const byKey: Record<string, number> = payload.reduce((acc, p) => {
      acc[p.dataKey] = p.value;
      return acc;
    }, {} as Record<string, number>);
    return (
      <div className="rounded-xl border bg-white p-3 shadow">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="mt-1 space-y-1 text-sm">
          <div>Gross: <span className="font-semibold">{currency(byKey.gross_pay)}</span></div>
          <div>Deductions: <span className="font-semibold">{currency(byKey.total_deductions)}</span></div>
          <div>Net: <span className="font-semibold">{currency(byKey.net_pay)}</span></div>
        </div>
      </div>
    );
  }
  return null;
};

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

const DonutTooltip: React.FC<DonutTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const p = payload[0];
    return (
      <div className="rounded-xl border bg-white p-3 shadow text-sm">
        <div className="font-medium">{p?.name}</div>
        <div className="text-gray-600">{p?.value} employees</div>
      </div>
    );
  }
  return null;
};

const CompanyOverview = () => {
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();

  const [data, setData] = useState<DashboardData | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!companyId || !session) {
      setError("Invalid company ID or session.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/company/${companyId}/dashboard/overview?year=${year}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch dashboard data.");

      setData(json);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session, year]);

  useEffect(() => {
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const payrollData = useMemo(() => {
    if (!data?.payrollMonthly) return MONTHS.map((m) => ({ month: m, gross_pay: 0, total_deductions: 0, net_pay: 0 }));
    type PayrollMonthlyData = typeof data.payrollMonthly[0];
    const byMonth: Record<string, PayrollMonthlyData> = Object.create(null);
    for (const row of data.payrollMonthly) byMonth[row.month] = row;
    return MONTHS.map((m) => byMonth[m] || { month: m, gross_pay: 0, total_deductions: 0, net_pay: 0 });
}, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-8">
        <p>Error: {error}</p>
        <p>Please check your network connection or try again later.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 mt-8">No data found for this company.</div>
    );
  }

  const donutColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6", "#f97316"];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Company Overview</h1>

      {/* Top cards (bento row) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold">{data.totalEmployees}</div>
            <div className="text-xs text-gray-500">Across all departments</div>
          </CardContent>
        </Card>

        {/* Active Employees */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold">{data.activeEmployees}</div>
            <div className="text-xs text-gray-500">Currently on payroll</div>
          </CardContent>
        </Card>

        {/* Bonus bento tile: quick facts */}
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-500">Selected Year</div>
              <div className="font-semibold">{data.selectedYear}</div>
            </div>
            <div>
              <div className="text-gray-500">Available Years</div>
              <div className="font-semibold">{data.availableYears?.join(", ") || "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">Last Payroll</div>
              <div className="font-semibold">{data.recentPayrolls?.[0]?.payroll_date ? new Date(data.recentPayrolls[0].payroll_date).toLocaleDateString() : "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">Last Net Pay</div>
              <div className="font-semibold">{currency(data.recentPayrolls?.[0]?.total_net_pay || 0)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid gap-4 mt-6 lg:grid-cols-3">
        {/* Payroll Runs Chart */}
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Payroll Overview</CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500" htmlFor="year-select">Year</label>
              <select
                id="year-select"
                className="border rounded-md px-2 py-1 text-sm bg-white"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {(data.availableYears?.length ? data.availableYears : [year]).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollData} barGap={6} barCategoryGap={20} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `${Math.round(v/1000)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<PayrollTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <Bar dataKey="gross_pay" name="Gross" radius={[5, 5, 0, 0]} fill="#8884d8" />
                <Bar dataKey="total_deductions" name="Deductions" radius={[4, 4, 0, 0]} fill="#82ca9d" />
                <Bar dataKey="net_pay" name="Net" radius={[5, 5, 0, 0]} fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution Donut */}
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Employees by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] flex items-center justify-center">
            {data.departments?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.departments}
                    dataKey="employeeCount"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {data.departments.map((_, idx) => (
                      <Cell key={idx} fill={donutColors[idx % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500">No departments yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Optional: small recent runs list (bento add-on) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-lg lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Payroll Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Payroll #</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentPayrolls || []).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4 font-medium">{r.payroll_number}</td>
                      <td className="py-2 pr-4">{new Date(r.payroll_date).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{currency(r.total_net_pay)}</td>
                    </tr>
                  ))}
                  {!data.recentPayrolls?.length && (
                    <tr>
                      <td colSpan={3} className="py-3 text-gray-500">No payroll runs yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyOverview;