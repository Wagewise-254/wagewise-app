// src/components/dashboard/reports/EmployeeReportSection.tsx - Updated with Charts

import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Recharts imports
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid
} from 'recharts';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Define data types for employee reports
interface DistributionData {
  name: string; // Category name (e.g., "Male", "Sales", "Full-time")
  value: number; // Count
}

interface EmployeeReportData {
  genderDistribution: DistributionData[];
  departmentDistribution: DistributionData[];
  jobTypeDistribution: DistributionData[];
  salaryRangeDistribution: DistributionData[];
  tenureDistribution: DistributionData[];
}

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF00FF', '#00FFFF', '#FF0088'];
const BAR_COLORS = '#4F46E5'; // Indigo color for bars

const EmployeeReportSection: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [employeeReportData, setEmployeeReportData] = useState<EmployeeReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployeeReportData = async () => {
      if (!accessToken) {
        setError("Authentication token missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/reports/employees`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data) {
          setEmployeeReportData(response.data);
        } else {
          setEmployeeReportData(null);
          console.warn("Unexpected response format for employee report data:", response.data);
        }
      } catch (err: unknown) {
        console.error("Error fetching employee report data:", err);
        if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
          const backendError = err.response.data as { error?: string; message?: string };
          setError(backendError.error || backendError.message || 'Failed to fetch employee report data.');
        } else {
          setError('An unexpected error occurred while fetching employee report data.');
        }
        setEmployeeReportData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeReportData();
  }, [accessToken]);

  const renderChart = (data: DistributionData[], title: string, type: 'pie' | 'bar') => {
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
    if (!data || data.length === 0) {
      return <p className="text-center text-gray-500">No data available for {title.toLowerCase()}.</p>;
    }

    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} employees`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    } else if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value, name) => [`${value} employees`, name]} />
            <Legend />
            <Bar dataKey="value" fill={BAR_COLORS} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return null;
  };


  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Employee Reports</h2>
      <p className="text-gray-600 mb-6">Detailed reports and analytics related to employees.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Gender Distribution</CardTitle></CardHeader>
          <CardContent>{renderChart(employeeReportData?.genderDistribution || [], 'Gender Distribution', 'pie')}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Department Distribution</CardTitle></CardHeader>
          <CardContent>{renderChart(employeeReportData?.departmentDistribution || [], 'Department Distribution', 'pie')}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Job Type Distribution</CardTitle></CardHeader>
          <CardContent>{renderChart(employeeReportData?.jobTypeDistribution || [], 'Job Type Distribution', 'pie')}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Salary Range Distribution</CardTitle></CardHeader>
          <CardContent>{renderChart(employeeReportData?.salaryRangeDistribution || [], 'Salary Range Distribution', 'bar')}</CardContent>
        </Card>

        <Card className="lg:col-span-2"> {/* Span full width for tenure */}
          <CardHeader><CardTitle>Employee Tenure (By Year Joined)</CardTitle></CardHeader>
          <CardContent>{renderChart(employeeReportData?.tenureDistribution || [], 'Employee Tenure', 'bar')}</CardContent>
        </Card>

        {/* TODO: Add options to export employee lists (e.g., active employees, new hires in a period) */}
      </div>
    </div>
  );
};

export default EmployeeReportSection;
