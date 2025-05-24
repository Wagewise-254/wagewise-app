// src/components/dashboard/reports/OverviewReportSection.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useNavigate} from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Recharts imports
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  //BarChart,
 // XAxis,
 // YAxis,
 // Bar,
} from 'recharts';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Define data types for reports
interface EmployeeStatusData {
  name: string; // e.g., "Active", "On Leave"
  value: number; // count
}

interface OverviewData {
  totalEmployees: number;
  employeeStatusDistribution: EmployeeStatusData[];
  // Add more overview data fields here later
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF00FF']; // Colors for Pie Chart

const OverviewReportSection: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!accessToken) {
        setError("Authentication token missing.");
        navigate
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/reports/overview`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data) {
          setOverviewData(response.data);
        } else {
          setOverviewData(null);
          console.warn("Unexpected response format for overview data:", response.data);
        }
      } catch (err: unknown) {
        console.error("Error fetching overview data:", err);
        if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
          const backendError = err.response.data as { error?: string; message?: string };
          setError(backendError.error || backendError.message || 'Failed to fetch overview data.');
        } else {
          setError('An unexpected error occurred while fetching overview data.');
        }
        setOverviewData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [accessToken, navigate]);

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
            </div>
          )}
          {!loading && error && (
            <p className="text-red-500 text-center">{error}</p>
          )}
          {!loading && !error && overviewData && (
            <p className="text-5xl font-bold text-center text-gray-800">
              {overviewData.totalEmployees}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
            </div>
          )}
          {!loading && error && (
            <p className="text-red-500 text-center">{error}</p>
          )}
          {!loading && !error && overviewData && overviewData.employeeStatusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overviewData.employeeStatusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {overviewData.employeeStatusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} employees`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            !loading && !error && <p className="text-center text-gray-500">No employee status data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Add more overview cards/charts here */}
    </div>
  );
};

export default OverviewReportSection;
