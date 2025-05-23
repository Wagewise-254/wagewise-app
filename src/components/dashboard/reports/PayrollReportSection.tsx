// src/components/dashboard/reports/PayrollReportSection.tsx - Updated with Bar Charts

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Recharts imports
import {
  BarChart, // Changed from LineChart
  Bar,      // Changed from Line
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Define data types for payroll reports (remain the same)
interface MonthlyPayrollTrend {
  month: string; // e.g., "January 2025"
  grossPay: number;
  netPay: number;
  paye: number;
  shif: number;
  nssfEmployee: number;
  helbDeductions: number;
  housingLevyEmployee: number;
  totalDeductions: number;
  totalBenefits: number;
}

interface BreakdownData {
  name: string; // e.g., "PAYE", "SHIF"
  value: number; // amount
}

interface PayrollReportData {
  monthlyPayrollTrends: MonthlyPayrollTrend[];
  latestPayrollBreakdown: BreakdownData[];
}

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF00FF', '#00FFFF', '#FF0088'];
const BAR_FILL_COLOR_GROSS = '#4F46E5'; // Indigo for Gross Pay
const BAR_FILL_COLOR_NET = '#10B981'; // Emerald for Net Pay
const BAR_FILL_COLOR_DEDUCTIONS = '#EF4444'; // Red for Deductions

const PayrollReportSection: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [payrollReportData, setPayrollReportData] = useState<PayrollReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayrollReportData = async () => {
      if (!accessToken) {
        setError("Authentication token missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/reports/payroll`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data) {
          setPayrollReportData(response.data);
        } else {
          setPayrollReportData(null);
          console.warn("Unexpected response format for payroll report data:", response.data);
        }
      } catch (err: unknown) {
        console.error("Error fetching payroll report data:", err);
        if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
          const backendError = err.response.data as { error?: string; message?: string };
          setError(backendError.error || backendError.message || 'Failed to fetch payroll report data.');
        } else {
          setError('An unexpected error occurred while fetching payroll report data.');
        }
        setPayrollReportData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollReportData();
  }, [accessToken]);

  const renderLoadingOrError = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
        </div>
      );
    }
    if (error) {
      return <p className="text-red-500 text-center">{error}</p>;
    }
    return null;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Payroll Reports</h2>
      <p className="text-gray-600 mb-6">Reports and trends related to payroll runs over time.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Gross Pay & Net Pay Trend</CardTitle></CardHeader>
          <CardContent>
            {renderLoadingOrError()}
            {!loading && !error && payrollReportData?.monthlyPayrollTrends && payrollReportData.monthlyPayrollTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart // Changed to BarChart
                  data={payrollReportData.monthlyPayrollTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `KSh ${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="grossPay" fill={BAR_FILL_COLOR_GROSS} name="Gross Pay" /> {/* Changed to Bar */}
                  <Bar dataKey="netPay" fill={BAR_FILL_COLOR_NET} name="Net Pay" />       {/* Changed to Bar */}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              !loading && !error && <p className="text-center text-gray-500">No monthly payroll trend data available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statutory Deductions Trend</CardTitle></CardHeader>
          <CardContent>
            {renderLoadingOrError()}
            {!loading && !error && payrollReportData?.monthlyPayrollTrends && payrollReportData.monthlyPayrollTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart // Changed to BarChart
                  data={payrollReportData.monthlyPayrollTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `KSh ${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="paye" fill="#FF00FF" name="PAYE" />
                  <Bar dataKey="shif" fill="#00FFFF" name="SHIF" />
                  <Bar dataKey="nssfEmployee" fill="#FF4500" name="NSSF (Emp)" />
                  <Bar dataKey="helbDeductions" fill="#8A2BE2" name="HELB" />
                  <Bar dataKey="housingLevyEmployee" fill="#20B2AA" name="Housing Levy" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              !loading && !error && <p className="text-center text-gray-500">No statutory deductions trend data available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Latest Payroll Deductions Breakdown</CardTitle></CardHeader>
          <CardContent>
            {renderLoadingOrError()}
            {!loading && !error && payrollReportData?.latestPayrollBreakdown && payrollReportData.latestPayrollBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={payrollReportData.latestPayrollBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60} // Creates a doughnut chart
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {payrollReportData.latestPayrollBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`KSh ${(Number(value)).toFixed(2)}`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              !loading && !error && <p className="text-center text-gray-500">No latest payroll deductions breakdown available.</p>
            )}
          </CardContent>
        </Card>

        {/* TODO: Add options to export payroll summaries, detailed payroll reports */}
      </div>
    </div>
  );
};

export default PayrollReportSection;
