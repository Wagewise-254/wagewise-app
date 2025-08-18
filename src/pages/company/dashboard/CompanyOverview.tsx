// src/pages/company/CompanyOverview.tsx
import { useState, useEffect, useCallback } from "react";
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
import {
  Users,
  Briefcase,
  Layers,
  BarChart,
  CircleDollarSign,
  Loader2,
} from "lucide-react";

interface DashboardData {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  totalPayrollRuns: number;
  totalNetPay: number;
}

const CompanyOverview = () => {
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
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
        `${API_BASE_URL}/company/${companyId}/overview`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch dashboard data.");
      }
      setDashboardData(data);
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || "An unexpected error occurred.");
      toast.error(
        (err as Error).message || "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500 mt-8">
        No data found for this company.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Company Overview
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees Card */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalEmployees}
            </div>
          </CardContent>
        </Card>

        {/* Active Employees Card */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Employees
            </CardTitle>
            <Briefcase className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.activeEmployees}
            </div>
          </CardContent>
        </Card>

        {/* Total Departments Card */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Departments
            </CardTitle>
            <Layers className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalDepartments}
            </div>
          </CardContent>
        </Card>

        {/* Total Payroll Runs Card */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payroll Runs
            </CardTitle>
            <BarChart className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalPayrollRuns}
            </div>
          </CardContent>
        </Card>

        {/* Total Net Pay (Latest Run) Card */}
        <Card className="shadow-lg col-span-full md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Latest Net Pay
            </CardTitle>
            <CircleDollarSign className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {dashboardData.totalNetPay.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyOverview;
