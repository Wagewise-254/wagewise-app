// src/components/dashboard/payroll/PayrollReportsSection.tsx - Updated with File Generation

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Banknote, FileDown, Loader2 } from 'lucide-react'; // Icons for reports/files
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Re-use PayrollRun interface from PayrollPage/PayrollHistorySection
interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string; // e.g., "January 2025"
  status: 'Draft' | 'Finalized' | 'Paid';
  run_date: string; // ISO string
}

const PayrollReportsSection: React.FC = () => {
  const { accessToken } = useAuthStore();

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedPayrollRunId, setSelectedPayrollRunId] = useState<string | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch Payroll Runs for Selection ---
  useEffect(() => {
    const fetchPayrollRunsForSelection = async () => {
      if (!accessToken) {
        setError("Authentication token missing.");
        setLoadingRuns(false);
        return;
      }

      setLoadingRuns(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/payroll`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data && Array.isArray(response.data.payrollRuns)) {
          setPayrollRuns(response.data.payrollRuns);
          // Optionally pre-select the latest payroll run
          if (response.data.payrollRuns.length > 0) {
            setSelectedPayrollRunId(response.data.payrollRuns[0].id);
          }
        } else {
          setPayrollRuns([]);
          console.warn("Unexpected response format for payroll runs fetch in reports:", response.data);
        }
      } catch (err: unknown) {
        console.error("Error fetching payroll runs for reports:", err);
        if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
          const backendError = err.response.data as { error?: string; message?: string };
          setError(backendError.error || backendError.message || 'Failed to fetch payroll runs for reports.');
        } else {
          setError('An unexpected error occurred while fetching payroll runs for reports.');
        }
        setPayrollRuns([]);
      } finally {
        setLoadingRuns(false);
      }
    };

    fetchPayrollRunsForSelection();
  }, [accessToken]);


  // --- Handle Generate Payslips ---
  const handleGeneratePayslips = async () => {
    if (!selectedPayrollRunId) {
      toast.error("Please select a payroll run first.");
      return;
    }
    if (!accessToken) {
      toast.error("Authentication token missing. Cannot generate payslips.");
      return;
    }

    setLoadingReport(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payroll/generate-payslips/${selectedPayrollRunId}`,
        {}, // Empty body for POST request
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: 'blob', // Important for downloading files
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Get filename from response headers if available, otherwise use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'payslips.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast.success("Payslips generated and downloaded successfully!");

    } catch (err: unknown) {
      console.error("Error generating payslips:", err);
      if (axios.isAxiosError(err) && err.response && err.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function() {
          try {
            const errorText = reader.result as string;
            const backendError = JSON.parse(errorText) as { error?: string; message?: string };
            toast.error(backendError.error || backendError.message || 'Failed to generate payslips.');
          } catch {
            toast.error('Failed to generate payslips. Could not read error.');
          }
        };
        reader.readAsText(err.response.data);
      } else if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        toast.error(backendError.error || backendError.message || 'Failed to generate payslips.');
      } else {
        toast.error('An unexpected error occurred while generating payslips.');
      }
    } finally {
      setLoadingReport(false);
    }
  };

  // --- Handle Generate Bank File ---
  const handleGenerateBankFile = async (method: 'Bank Transfer' | 'Mpesa' | 'Cash') => {
    if (!selectedPayrollRunId) {
      toast.error("Please select a payroll run first.");
      return;
    }
    if (!accessToken) {
      toast.error("Authentication token missing. Cannot generate bank file.");
      return;
    }

    setLoadingReport(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payroll/generate-bank-file/${selectedPayrollRunId}/${encodeURIComponent(method)}`,
        {}, // Empty body for POST request
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: 'blob', // Important for downloading files
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${method.toLowerCase().replace(/\s/g, '_')}_file.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast.success(`${method} file generated and downloaded successfully!`);

    } catch (err: unknown) {
      console.error(`Error generating ${method} file:`, err);
      if (axios.isAxiosError(err) && err.response && err.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function() {
          try {
            const errorText = reader.result as string;
            const backendError = JSON.parse(errorText) as { error?: string; message?: string };
            toast.error(backendError.error || backendError.message || `Failed to generate ${method} file.`);
          } catch {
            toast.error(`Failed to generate ${method} file. Could not read error.`);
          }
        };
        reader.readAsText(err.response.data);
      } else if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        toast.error(backendError.error || backendError.message || `Failed to generate ${method} file.`);
      } else {
        toast.error(`An unexpected error occurred while generating ${method} file.`);
      }
    } finally {
      setLoadingReport(false);
    }
  };


  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Payroll Reports & Files</h2>
      <p className="text-gray-600 mb-6">Generate payslips, bank files, and statutory reports for finalized payroll runs.</p>

      {/* Select Payroll Run */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 items-center gap-4">
        <Label htmlFor="payrollRunSelect" className="text-right md:text-left">
          Select Payroll Run:
        </Label>
        <Select
          onValueChange={setSelectedPayrollRunId}
          value={selectedPayrollRunId || ''}
          disabled={loadingRuns || loadingReport}
        >
          <SelectTrigger id="payrollRunSelect" className="w-full">
            <SelectValue placeholder={loadingRuns ? "Loading payroll runs..." : "Select a payroll run"} />
          </SelectTrigger>
          <SelectContent>
            {payrollRuns.length === 0 && !loadingRuns && (
                <SelectItem disabled value="">No payroll runs available</SelectItem>
            )}
            {payrollRuns.map((run) => (
              <SelectItem key={run.id} value={run.id}>
                {run.payroll_month} ({run.payroll_number}) - {new Date(run.run_date).toLocaleDateString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="col-span-full text-red-500 text-sm text-center">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          onClick={handleGeneratePayslips}
          className="h-auto py-4"
          disabled={!selectedPayrollRunId || loadingReport}
        >
          {loadingReport ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />}
          {loadingReport ? 'Generating...' : 'Generate Payslips (ZIP)'}
        </Button>
        <Button
          onClick={() => handleGenerateBankFile('Bank Transfer')}
          className="h-auto py-4"
          disabled={!selectedPayrollRunId || loadingReport}
        >
          {loadingReport ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Banknote className="mr-2 h-5 w-5" />}
          {loadingReport ? 'Generating...' : 'Generate Bank Transfer File'}
        </Button>
        <Button
          onClick={() => handleGenerateBankFile('Mpesa')}
          className="h-auto py-4"
          disabled={!selectedPayrollRunId || loadingReport}
        >
          {loadingReport ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Banknote className="mr-2 h-5 w-5" />}
          {loadingReport ? 'Generating...' : 'Generate M-Pesa File'}
        </Button>
        <Button
          onClick={() => handleGenerateBankFile('Cash')}
          className="h-auto py-4"
          disabled={!selectedPayrollRunId || loadingReport}
        >
          {loadingReport ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
          {loadingReport ? 'Generating...' : 'Generate Cash Payment List'}
        </Button>
        {/* Add more report generation options as needed */}
      </div>
    </div>
  );
};

export default PayrollReportsSection;
