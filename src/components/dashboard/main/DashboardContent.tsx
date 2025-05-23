// src/components/dashboard/main/DashboardContent.tsx - Scrollability Fix

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, DollarSign, Wallet, MinusCircle } from 'lucide-react';
import { toast } from 'sonner'; // Re-added toast import as it's good practice for error messages
import axios from 'axios';

// Recharts imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Define data types for dashboard summary
interface MonthlyPayrollOverview {
  month: string;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
}

interface LatestPayrollSummary {
  payroll_month: string;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
}

interface DashboardData {
  totalActiveEmployees: number;
  latestPayrollSummary: LatestPayrollSummary | null;
  monthlyPayrollOverview: MonthlyPayrollOverview[];
}

const DashboardContent: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!accessToken) {
        setError("Authentication token missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/reports/dashboard-summary`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data) {
          setDashboardData(response.data);
        } else {
          setDashboardData(null);
          console.warn("Unexpected response format for dashboard data:", response.data);
        }
      } catch (err: unknown) {
        console.error("Error fetching dashboard data:", err);
        if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
          const backendError = err.response.data as { error?: string; message?: string };
          setError(backendError.error || backendError.message || 'Failed to fetch dashboard data.');
          toast.error(backendError.error || backendError.message || 'Failed to fetch dashboard data.'); // Added toast
        } else {
          setError('An unexpected error occurred while fetching dashboard data.');
          toast.error('An unexpected error occurred while fetching dashboard data.'); // Added toast
        }
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [accessToken]);

  const renderLoadingOrError = (height: string = 'h-32') => {
    if (loading) {
      return (
        <div className={`flex justify-center items-center ${height}`}>
          <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
        </div>
      );
    }
    if (error) {
      return <p className="text-red-500 text-center p-4">{error}</p>;
    }
    return null;
  };

  return (
    // REMOVED: overflow-hidden from this div. The parent MainDashboard.tsx will handle scrolling.
    <div className="flex-1 flex flex-col p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderLoadingOrError('h-16')}
            {!loading && !error && (
              <div className="text-2xl font-bold">
                {dashboardData?.totalActiveEmployees ?? 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderLoadingOrError('h-16')}
            {!loading && !error && (
              <div className="text-2xl font-bold">
                {dashboardData?.latestPayrollSummary?.total_gross_pay ? `KSh ${dashboardData.latestPayrollSummary.total_gross_pay.toFixed(2)}` : 'N/A'}
              </div>
            )}
            {dashboardData?.latestPayrollSummary && (
              <p className="text-xs text-muted-foreground">
                For {dashboardData.latestPayrollSummary.payroll_month}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Net Pay</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderLoadingOrError('h-16')}
            {!loading && !error && (
              <div className="text-2xl font-bold">
                {dashboardData?.latestPayrollSummary?.total_net_pay ? `KSh ${dashboardData.latestPayrollSummary.total_net_pay.toFixed(2)}` : 'N/A'}
              </div>
            )}
            {dashboardData?.latestPayrollSummary && (
              <p className="text-xs text-muted-foreground">
                For {dashboardData.latestPayrollSummary.payroll_month}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Total Deductions</CardTitle>
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderLoadingOrError('h-16')}
            {!loading && !error && (
              <div className="text-2xl font-bold">
                {dashboardData?.latestPayrollSummary?.total_deductions ? `KSh ${dashboardData.latestPayrollSummary.total_deductions.toFixed(2)}` : 'N/A'}
              </div>
            )}
            {dashboardData?.latestPayrollSummary && (
              <p className="text-xs text-muted-foreground">
                For {dashboardData.latestPayrollSummary.payroll_month}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Payroll Overview Chart */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Monthly Payroll Overview (Gross vs. Net vs. Deductions)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]"> {/* Fixed height for chart */}
          {renderLoadingOrError('h-full')}
          {!loading && !error && dashboardData?.monthlyPayrollOverview && dashboardData.monthlyPayrollOverview.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.monthlyPayrollOverview}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => {
                  const num = typeof value === 'number' ? value : parseFloat(value as string);
                  return isNaN(num) ? 'KSh N/A' : `KSh ${num.toFixed(2)}`;
                }} />
                <Legend />
                {/* Stacked bars: Net Pay and Total Deductions stack on top of each other */}
                <Bar dataKey="totalDeductions" stackId="a" fill="#EF4444" name="Total Deductions" />
                <Bar dataKey="netPay" stackId="a" fill="#10B981" name="Net Pay" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            !loading && !error && <p className="text-center text-gray-500 py-8">No payroll data available for trends.</p>
          )}
        </CardContent>
      </Card>

      {/* You can add more dashboard elements here */}
    </div>
  );
};

export default DashboardContent;
