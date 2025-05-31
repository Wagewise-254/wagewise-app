// src/components/dashboard/payroll/GenerateBulkFilesDialog.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, DownloadCloud, FileText, Banknote, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from 'lucide-react'; // Use specific icons
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Match reportOptions from PayrollReportsSection or define a common source
const reportOptionsForBulkDownload = [
  { value: 'Payroll_Summary_Report', label: 'Payroll Summary Report', icon: FileText, defaultSelected: true },
  { value: 'KRA_SEC_B1_PAYE', label: 'KRA PAYE Return (SEC B1)', icon: FileText, defaultSelected: true },
  { value: 'NSSF_Return', label: 'NSSF Return', icon: FileText, defaultSelected: true },
  { value: 'NHIF_Return', label: 'SHIF (NHIF) Return', icon: FileText, defaultSelected: true },
  { value: 'Housing_Levy_Return', label: 'Housing Levy Return', icon: FileText, defaultSelected: true },
  { value: 'Bank_Payment_File', label: 'Bank Payment File (Generic)', icon: Banknote, defaultSelected: false },
  { value: 'Mpesa_Payment_File', label: 'M-Pesa Payment File', icon: Banknote, defaultSelected: false },
  { value: 'Deduction_Report', label: 'Overall Deduction Report', icon: FileText, defaultSelected: false },
];

interface GenerateBulkFilesDialogProps {
  isOpen: boolean;
  onClose: (refetchHistory: boolean) => void;
  payrollRunId: string;
  payrollMonthYear: string;
}

type FileGenerationStatus = 'idle' | 'pending' | 'success' | 'error';

const GenerateBulkFilesDialog: React.FC<GenerateBulkFilesDialogProps> = ({
  isOpen,
  onClose,
  payrollRunId,
  payrollMonthYear,
}) => {
  const { accessToken } = useAuthStore();
  const [selectedFiles, setSelectedFiles] = useState<string[]>(
    reportOptionsForBulkDownload.filter(opt => opt.defaultSelected).map(opt => opt.value)
  );
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileGenerationStatus>>(
    Object.fromEntries(reportOptionsForBulkDownload.map(opt => [opt.value, 'idle']))
  );

  useEffect(() => { // Reset selections and statuses when dialog reopens for a new run
    if (isOpen) {
      setSelectedFiles(reportOptionsForBulkDownload.filter(opt => opt.defaultSelected).map(opt => opt.value));
      setFileStatuses(Object.fromEntries(reportOptionsForBulkDownload.map(opt => [opt.value, 'idle'])));
    }
  }, [isOpen, payrollRunId]);


  const handleFileSelectionChange = (fileType: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileType) ? prev.filter(ft => ft !== fileType) : [...prev, fileType]
    );
  };

  const downloadFile = async (fileType: string, fileNamePrefix: string): Promise<boolean> => {
    if (!accessToken) {
      toast.error("Authentication required for downloading files.");
      return false;
    }
    setFileStatuses(prev => ({ ...prev, [fileType]: 'pending' }));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/payroll/generate-file/${payrollRunId}`,
        { fileType },
        { headers: { Authorization: `Bearer ${accessToken}` }, responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      let filename = `${fileNamePrefix.toLowerCase().replace(/\s+/g, '_')}_${payrollMonthYear.replace(/\s+/g, '_')}.unknown`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setFileStatuses(prev => ({ ...prev, [fileType]: 'success' }));
      return true;
    } catch (err) {
      console.error(`Error generating ${fileType}:`, err);
      let errorMsg = `Failed to download ${fileNamePrefix}.`;
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
      toast.error(errorMsg, { id: `err-${fileType}` });
      setFileStatuses(prev => ({ ...prev, [fileType]: 'error' }));
      return false;
    }
  };

  const handleGenerateSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.info("No files selected for generation.");
      return;
    }
    setIsGeneratingAll(true);
    let allDownloadsSuccessful = true;

    for (const fileType of selectedFiles) {
      const reportOption = reportOptionsForBulkDownload.find(opt => opt.value === fileType);
      if (reportOption) {
        const success = await downloadFile(fileType, reportOption.label);
        if (!success) allDownloadsSuccessful = false;
        if (selectedFiles.indexOf(fileType) < selectedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Stagger downloads slightly
        }
      }
    }
    setIsGeneratingAll(false);
    if (allDownloadsSuccessful && selectedFiles.length > 0) {
      toast.success("All selected files processed!");
    } else if (selectedFiles.length > 0) {
      toast.warning("Some files encountered issues during download.");
    }
  };

  const getStatusIcon = (status: FileGenerationStatus) => {
    switch (status) {
      case 'pending': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default: return <AlertCircleIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />; // Idle, show on hover
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { if (!isGeneratingAll) onClose(true); }}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <DownloadCloud className="mr-2 h-6 w-6 text-[#7F5EFD]" />
            Generate Files for {payrollMonthYear}
          </DialogTitle>
          <DialogDescription>
            Payroll run is complete. Select the files you wish to download.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(70vh-180px)] min-h-[200px] my-4 pr-3">
            <div className="space-y-1">
            {reportOptionsForBulkDownload.map(opt => (
                <div
                    key={opt.value}
                    className={`group flex items-center space-x-3 p-2.5 rounded-md hover:bg-gray-100 transition-colors ${selectedFiles.includes(opt.value) ? 'bg-purple-50' : ''}`}
                    onClick={() => !isGeneratingAll && handleFileSelectionChange(opt.value)}
                    role="checkbox"
                    aria-checked={selectedFiles.includes(opt.value)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') !isGeneratingAll && handleFileSelectionChange(opt.value); }}
                >
                    <Checkbox
                        id={`cb-bulk-${opt.value}`}
                        checked={selectedFiles.includes(opt.value)}
                        onCheckedChange={() => handleFileSelectionChange(opt.value)} // This is needed for keyboard accessibility and screen readers
                        disabled={isGeneratingAll}
                        className="data-[state=checked]:bg-[#7F5EFD] data-[state=checked]:border-[#7F5EFD]"
                        aria-labelledby={`label-bulk-${opt.value}`}
                    />
                    <Label htmlFor={`cb-bulk-${opt.value}`} id={`label-bulk-${opt.value}`} className="flex-1 text-sm font-medium text-gray-700 cursor-pointer flex items-center">
                        <opt.icon className="mr-2 h-4 w-4 text-gray-500" />
                        {opt.label}
                    </Label>
                    <div className="w-5 h-5 flex items-center justify-center">
                        {getStatusIcon(fileStatuses[opt.value])}
                    </div>
                </div>
            ))}
            </div>
        </ScrollArea>

        <DialogFooter className="mt-2 flex-col sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => onClose(true)} disabled={isGeneratingAll} className="w-full sm:w-auto mb-2 sm:mb-0">
                Skip / Finish
            </Button>
            <Button
                onClick={handleGenerateSelectedFiles}
                disabled={isGeneratingAll || selectedFiles.length === 0}
                className="bg-[#7F5EFD] hover:bg-[#6a4fcf] text-white w-full sm:w-auto"
            >
                {isGeneratingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                {isGeneratingAll ? 'Generating...' : `Download Selected (${selectedFiles.length})`}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateBulkFilesDialog;