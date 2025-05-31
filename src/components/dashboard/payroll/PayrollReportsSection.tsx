// src/components/dashboard/payroll/PayrollReportsSection.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Banknote, FileDown, Loader2, DownloadCloud, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';
import { Card,  CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';


interface PayrollRun {
  id: string;
  payroll_number: string;
  payroll_month: string;
  status: string;
  run_date: string;
}

// Define available report types - these should match backend 'fileType' keys
const reportOptions = [
  { value: 'KRA_SEC_B1_PAYE', label: 'KRA PAYE Return (SEC B1)', icon: FileText },
  { value: 'NSSF_Return', label: 'NSSF Return', icon: FileText },
  { value: 'NHIF_Return', label: 'SHIF (NHIF) Return', icon: FileText }, // SHIF is the new NHIF
  { value: 'Housing_Levy_Return', label: 'Housing Levy Return', icon: FileText },
  { value: 'HELB_Deduction_Report', label: 'HELB Deduction Report', icon: FileText },
  { value: 'FBT_Report', label: 'Fringe Benefit Tax (FBT) Report', icon: FileText },
  { value: 'Bank_Payment_File', label: 'Bank Payment File (Generic)', icon: Banknote },
  { value: 'Mpesa_Payment_File', label: 'M-Pesa Payment File', icon: Banknote },
  { value: 'Cash_Payment_Sheet', label: 'Cash Payment Sheet', icon: FileDown },
  { value: 'Payroll_Summary_Report', label: 'Payroll Summary Report', icon: FileText },
  { value: 'Deduction_Report', label: 'Overall Deduction Report', icon: FileText },
  // { value: 'P9_Form', label: 'P9 Form (Annual - Placeholder)', icon: FileText, disabled: true }, // P9 is special
];


const PayrollReportsSection: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedPayrollRunId, setSelectedPayrollRunId] = useState<string | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [generatingFile, setGeneratingFile] = useState<string | null>(null); // Holds the fileType being generated
  const [error, setError] = useState<string | null>(null);

  const fetchPayrollRunsForSelection = useCallback(async (showLoader = true) => {
    if (!accessToken) {
      setError("Authentication token missing.");
      if(showLoader) setLoadingRuns(false);
      return;
    }
    if(showLoader) setLoadingRuns(true);
    setError(null);

    try {
      const response = await axios.get<{ payrollRuns: PayrollRun[] }>(`${API_BASE_URL}/payroll`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data && Array.isArray(response.data.payrollRuns)) {
        const completedRuns = response.data.payrollRuns.filter(run =>
            ['Payslips_Sent', 'Calculation_Complete', 'Paid', 'Finalized'].includes(run.status) // Only allow report generation for completed runs
        );
        setPayrollRuns(completedRuns);
        if (completedRuns.length > 0 && !selectedPayrollRunId) {
          setSelectedPayrollRunId(completedRuns[0].id);
        } else if (completedRuns.length === 0) {
            setSelectedPayrollRunId(null);
        }
      } else {
        setPayrollRuns([]);
        setSelectedPayrollRunId(null);
      }
    } catch (err) {
      // ... (error handling as before)
      setPayrollRuns([]);
      setSelectedPayrollRunId(null);
    } finally {
      if(showLoader) setLoadingRuns(false);
    }
  }, [accessToken, selectedPayrollRunId]);

  useEffect(() => {
    fetchPayrollRunsForSelection();
  }, [fetchPayrollRunsForSelection]);

  const handleGenerateFile = async (fileType: string, fileNamePrefix: string) => {
    if (!selectedPayrollRunId) {
      toast.error("Please select a payroll run first.");
      return;
    }
    if (!accessToken) {
      toast.error("Authentication required.");
      return;
    }

    setGeneratingFile(fileType);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payroll/generate-file/${selectedPayrollRunId}`,
        { fileType }, // Send fileType in the request body
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      let filename = `${fileNamePrefix.toLowerCase().replace(/\s+/g, '_')}_report.unknown`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      } else {
        // Fallback if header not present, try to guess extension
        const ext = reportOptions.find(opt => opt.value === fileType)?.value.split('_').pop()?.toLowerCase() || 'dat';
        if (ext === 'csv' || ext === 'xlsx' || ext === 'pdf') {
            filename = `${fileNamePrefix.toLowerCase().replace(/\s+/g, '_')}_report.${ext}`;
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url); // Clean up

      toast.success(`${fileNamePrefix} generated and downloaded successfully!`);

    } catch (err: unknown) {
      console.error(`Error generating ${fileType}:`, err);
      let errorMsg = `Failed to generate ${fileNamePrefix}.`;
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.data instanceof Blob && err.response.data.type === "application/json") {
            try {
                const errorJson = JSON.parse(await err.response.data.text()) as { error?: string; message?: string };
                errorMsg = errorJson.error || errorJson.message || errorMsg;
            } catch (e) { /* Could not parse blob as JSON */ }
        } else if (typeof err.response.data === 'object') {
            const backendError = err.response.data as { error?: string; message?: string };
            errorMsg = backendError.error || backendError.message || errorMsg;
        }
      }
      toast.error(errorMsg);
    } finally {
      setGeneratingFile(null);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Download Reports & Files</h2>
            <p className="text-sm text-gray-600 mt-1">Select a completed payroll run to generate specific statutory and payment files.</p>
        </div>
         <Button variant="outline" size="sm" onClick={() => fetchPayrollRunsForSelection(true)} disabled={loadingRuns || !!generatingFile} className="self-start sm:self-center">
           <RefreshCw className={`mr-2 h-4 w-4 ${loadingRuns ? 'animate-spin' : ''}`} />
           Refresh Runs
        </Button>
      </div>

      <div className="mb-8 p-4 bg-white rounded-lg shadow border max-w-xl">
        <Label htmlFor="payrollRunSelectReports" className="block text-sm font-medium text-gray-700 mb-1">
          Select Completed Payroll Run:
        </Label>
        <Select
          onValueChange={setSelectedPayrollRunId}
          value={selectedPayrollRunId || ''}
          disabled={loadingRuns || !!generatingFile}
        >
          <SelectTrigger id="payrollRunSelectReports" className="w-full border-gray-300 focus:border-[#7F5EFD] focus:ring-[#7F5EFD]">
            <SelectValue placeholder={loadingRuns ? "Loading payroll runs..." : "Select a payroll run"} />
          </SelectTrigger>
          <SelectContent>
            {payrollRuns.length === 0 && !loadingRuns && (
              <SelectItem value="no-runs-placeholder" disabled className="text-gray-500">
                No completed payroll runs available
              </SelectItem>
            )}
            {payrollRuns.map((run) => (
              <SelectItem key={run.id} value={run.id} className="hover:bg-gray-100">
                {run.payroll_month} ({run.payroll_number}) - {run.status.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="mt-2 text-red-600 text-xs text-center">{error}</p>}
        {!loadingRuns && payrollRuns.length === 0 && !error && (
            <p className="mt-2 text-sm text-gray-500">No payroll runs are currently available for report generation. Please ensure runs are completed.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reportOptions.map((report) => (
          <Card key={report.value} className="flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center">
                <report.icon className="mr-2 h-5 w-5 text-[#7F5EFD]" />
                {report.label}
              </CardTitle>
              {report.value === 'P9_Form' && <CardDescription className="text-xs">Annual report - requires specific logic.</CardDescription>}
            </CardHeader>
            <CardFooter>
              <Button
                onClick={() => handleGenerateFile(report.value, report.label)}
                className="w-full bg-[#7F5EFD] hover:bg-[#6a4fcf] text-white"
                disabled={!selectedPayrollRunId || !!generatingFile}
              >
                {generatingFile === report.value ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                {generatingFile === report.value ? 'Generating...' : 'Download'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PayrollReportsSection;