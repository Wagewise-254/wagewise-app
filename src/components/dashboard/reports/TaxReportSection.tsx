// src/components/dashboard/reports/TaxReportSection.tsx - Updated with Charts

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Define data types for tax reports
interface MonthlyTaxTrend {
  month: string; // e.g., "January 2025"
  paye: number;
  shif: number;
  nssfEmployee: number;
  nssfEmployer: number;
  helbDeductions: number;
  housingLevyEmployee: number;
  housingLevyEmployer: number;
}

interface BreakdownData {
  name: string; // e.g., "PAYE", "NSSF (Employer)"
  value: number; // amount
}

interface TaxReportData {
  monthlyTaxTrends: MonthlyTaxTrend[];
  latestStatutoryBreakdown: BreakdownData[];
}

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF00FF', '#00FFFF', '#FF0088', '#8800FF', '#00FF88'];
const BAR_COLORS_TAX = {
    paye: '#EF4444', // Red
    shif: '#3B82F6', // Blue
    nssfEmployee: '#10B981', // Green
    nssfEmployer: '#F59E0B', // Amber
    helbDeductions: '#6366F1', // Indigo
    housingLevyEmployee: '#EC4899', // Pink
    housingLevyEmployer: '#A855F7', // Purple
};


const TaxReportSection: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [taxReportData, setTaxReportData] = useState<TaxReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaxReportData = async () => {
      if (!accessToken) {
        setError("Authentication token missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/reports/tax`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data) {
          setTaxReportData(response.data);
        } else {
          setTaxReportData(null);
          console.warn("Unexpected response format for tax report data:", response.data);
        }
      } catch (err: unknown) {
        console.error("Error fetching tax report data:", err);
        if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
          const backendError = err.response.data as { error?: string; message?: string };
          setError(backendError.error || backendError.message || 'Failed to fetch tax report data.');
        } else {
          setError('An unexpected error occurred while fetching tax report data.');
        }
        setTaxReportData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxReportData();
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
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Tax Reports</h2>
      <p className="text-gray-600 mb-6">Reports and summaries related to tax, NSSF, SHIF, and Housing Levy contributions.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Monthly Statutory Contributions Trend (Employee & Employer)</CardTitle></CardHeader>
          <CardContent>
            {renderLoadingOrError()}
            {!loading && !error && taxReportData?.monthlyTaxTrends && taxReportData.monthlyTaxTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={taxReportData.monthlyTaxTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => {
                    const num = typeof value === 'number' ? value : parseFloat(value as string);
                    return `KSh ${!isNaN(num) ? num.toFixed(2) : value}`;
                  }} />
                  <Legend />
                  <Bar dataKey="paye" fill={BAR_COLORS_TAX.paye} name="PAYE" />
                  <Bar dataKey="shif" fill={BAR_COLORS_TAX.shif} name="SHIF" />
                  <Bar dataKey="nssfEmployee" fill={BAR_COLORS_TAX.nssfEmployee} name="NSSF (Emp)" />
                  <Bar dataKey="nssfEmployer" fill={BAR_COLORS_TAX.nssfEmployer} name="NSSF (Employer)" />
                  <Bar dataKey="helbDeductions" fill={BAR_COLORS_TAX.helbDeductions} name="HELB" />
                  <Bar dataKey="housingLevyEmployee" fill={BAR_COLORS_TAX.housingLevyEmployee} name="Housing Levy (Emp)" />
                  <Bar dataKey="housingLevyEmployer" fill={BAR_COLORS_TAX.housingLevyEmployer} name="Housing Levy (Employer)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              !loading && !error && <p className="text-center text-gray-500">No monthly tax trend data available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Latest Statutory Contributions Breakdown</CardTitle></CardHeader>
          <CardContent>
            {renderLoadingOrError()}
            {!loading && !error && taxReportData?.latestStatutoryBreakdown && taxReportData.latestStatutoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={taxReportData.latestStatutoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60} // Doughnut chart
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {taxReportData.latestStatutoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => {
                    const num = typeof value === 'number' ? value : parseFloat(value as string);
                    return [`KSh ${!isNaN(num) ? num.toFixed(2) : value}`, name];
                  }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              !loading && !error && <p className="text-center text-gray-500">No latest statutory contributions breakdown available.</p>
            )}
          </CardContent>
        </Card>

        {/* TODO: Add options to export statutory reports (KRA, NSSF, SHIF) */}
      </div>
    </div>
  );
};

export default TaxReportSection;
