// src/components/dashboard/main/DashboardContent.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users , PlayCircle } from 'lucide-react'; // Added PlayCircle for payroll run
import { toast } from 'sonner';
import axios from 'axios';
//import { Button } from '@/components/ui/button'; // Still need Button for payroll run
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // For year dropdown
import DashboardCalendar from './DashboardCalendar'; // Import the new Calendar component

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
  const { accessToken } = useAuthStore(); // Removed 'user' as avatar is gone
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString()); // Last 5 years

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
        const response = await axios.get(`${API_BASE_URL}/reports/dashboard-summary?year=${selectedYear}`, {
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
          toast.error(backendError.error || backendError.message || 'Failed to fetch dashboard data.');
        } else {
          setError('An unexpected error occurred while fetching dashboard data.');
          toast.error('An unexpected error occurred while fetching dashboard data.');
        }
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [accessToken, selectedYear]);

  const renderLoadingOrError = (height: string = 'h-32') => {
    if (loading) {
      return (
        <div className={`flex justify-center items-center ${height}`}>
          <Loader2 className="animate-spin h-6 w-6 text-[#7F5EFD]" />
        </div>
      );
    }
    if (error) {
      return <p className="text-red-500 text-center p-4">{error}</p>;
    }
    return null;
  };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const fullYearPayrollData = months.map(monthName => {
    const monthData = dashboardData?.monthlyPayrollOverview?.find(item => item.month === monthName);
    return {
      month: monthName,
      // Ensure values are numbers, default to 0 if undefined
      grossPay: monthData?.grossPay || 0,
      netPay: monthData?.netPay || 0,
      totalDeductions: monthData?.totalDeductions || 0,
    };
  });

  // Placeholder for "Run Payroll" action
  const handleRunPayroll = () => {
    toast.info("Run Payroll functionality coming soon!");
    // In a real application, you'd trigger a payroll process here
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-4 bg-gray-100"> {/* Added bg-gray-100 for consistency */}
      {/* Top Header/Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Good Evening</h1> {/* Dynamic greeting could be added */}
        <p className="text-sm text-gray-500">Sunday, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Top Row: Total Employees Card & Run Payroll Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Active Employees Card */}
        <Card className="shadow-sm bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Total Active Employees</CardTitle>
            <Users className="h-6 w-6 text-gray-500" /> {/* Larger icon */}
          </CardHeader>
          <CardContent>
            {renderLoadingOrError('h-16')}
            {!loading && !error && (
              <>
                <div className="text-4xl font-bold text-gray-900"> {/* Larger font for primary metric */}
                  {dashboardData?.totalActiveEmployees ?? 'N/A'}
                </div>
                <p className="text-sm text-green-600 mt-2">+2.1% from last month</p> {/* Example trend */}
              </>
            )}
          </CardContent>
        </Card>

        {/* Run Payroll Card */}
        <Card className="shadow-sm bg-[#7F5EFD] text-white border border-gray-200 cursor-pointer hover:bg-[#6a4fdd] transition-colors" onClick={handleRunPayroll}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Run Payroll</CardTitle>
            <PlayCircle className="h-6 w-6" /> {/* Icon for running payroll */}
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-[calc(100%-80px)]"> {/* Adjust height */}
             {/* Dynamic content for next payroll or status here */}
            <div className="text-3xl font-bold">
                Ready for Payroll run
            </div>
            <p className="text-sm opacity-80 mt-2">Click to initiate the next payroll cycle.</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Payroll Chart and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Payroll Overview Chart */}
        <Card className="lg:col-span-2 shadow-sm bg-white border border-gray-200">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-lg font-semibold text-gray-700">Monthly Payroll Overview</CardTitle>
            <Select onValueChange={setSelectedYear} defaultValue={selectedYear}>
              <SelectTrigger className="w-[120px] rounded-md border border-gray-300">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[400px] p-4">
            {renderLoadingOrError('h-full')}
            {!loading && !error && fullYearPayrollData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fullYearPayrollData}
                  margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 'auto']} />
                  <Tooltip
                      formatter={(value) => {
                          const num = typeof value === 'number' ? value : parseFloat(value as string);
                          return isNaN(num) ? 'N/A' : `KSh ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }}
                      labelFormatter={(label) => `Month: ${label} ${selectedYear}`}
                      contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#333' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                  {/* Bars for Gross Pay, Net Pay, and Deductions */}
                  <Bar dataKey="grossPay" fill="#A8DADC" name="Gross Pay" barSize={15} radius={[4, 4, 0, 0]} /> {/* Light blue */}
                  <Bar dataKey="netPay" fill="#457B9D" name="Net Pay" barSize={15} radius={[4, 4, 0, 0]} /> {/* Medium blue */}
                  <Bar dataKey="totalDeductions" fill="#E63946" name="Total Deductions" barSize={15} radius={[4, 4, 0, 0]} /> {/* Red for deductions */}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              !loading && !error && <p className="text-center text-gray-500 py-8">No payroll data available for trends.</p>
            )}
          </CardContent>
        </Card>

        {/* Calendar Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DashboardCalendar />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;