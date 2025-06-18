// src/components/dashboard/payroll/PayrollProgressDialog.tsx - CORRECTED & IMPROVED

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, Send, Download, MailWarning, SkipForward } from 'lucide-react';
import { toast } from 'sonner';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

type StepStatus = 'pending' | 'in-progress' | 'success' | 'error' | 'skipped';

interface ProgressDetails {
    stage: string;
    message: string;
    progress?: number;
    error?: string;
    total_employees_processed?: number;
}

interface PayrollStatusResponse {
    status: string;
    progressDetails?: ProgressDetails;
}

interface PayrollProgressDialogProps {
    isOpen: boolean;
    onClose: (refetchHistory: boolean) => void;
    payrollRunId: string;
    payrollMonthYear: string;
    onProcessingComplete: (success: boolean) => void;
}

const PayrollProgressDialog: React.FC<PayrollProgressDialogProps> = ({
    isOpen,
    onClose,
    payrollRunId,
    payrollMonthYear,
    onProcessingComplete,
}) => {
    const { accessToken } = useAuthStore();
    const [openAccordion, setOpenAccordion] = useState<string>("step1");

    const [calcStatus, setCalcStatus] = useState<StepStatus>('in-progress');
    const [emailStatus, setEmailStatus] = useState<StepStatus>('pending');
    const [fileStatus, setFileStatus] = useState<StepStatus>('pending');

    const [progressDetails, setProgressDetails] = useState<ProgressDetails | null>(null);
    const pollingIntervalIdRef = useRef<NodeJS.Timeout | null>(null);

    // CHANGE: Stop the polling function more explicitly
    const stopPolling = useCallback(() => {
        if (pollingIntervalIdRef.current) {
            clearInterval(pollingIntervalIdRef.current);
            pollingIntervalIdRef.current = null;
            console.log("Polling stopped.");
        }
    }, []);

    const fetchStatus = useCallback(async () => {
        if (!payrollRunId || !pollingIntervalIdRef.current) return; // Only run if polling is active

        try {
            const response = await axios.get<PayrollStatusResponse>(`${API_BASE_URL}/payroll/run-status/${payrollRunId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = response.data;
            setProgressDetails(data.progressDetails || null);
            
            // CHANGE: More robust check for terminal states
            const terminalCalculationStates = ['Calculation_Complete', 'Calculation_Failed', 'Completed_No_Employees'];
            if (terminalCalculationStates.includes(data.status)) {
                console.log(`Terminal state reached: ${data.status}. Stopping poller.`);
                stopPolling(); 

                if (data.status === 'Calculation_Complete' || data.status === 'Completed_No_Employees') {
                    setCalcStatus('success');
                    // CHANGE: Add a clearer success message before moving on
                    setProgressDetails(prev => ({
                        ...(prev ?? { stage: "Calculation", message: "" }),
                        stage: (prev && prev.stage) ? prev.stage : "Calculation",
                        message: "Calculation successful! Please proceed to the next step."
                    }));
                    setOpenAccordion("step2");
                } else {
                    setCalcStatus('error');
                    setProgressDetails(prev => ({
                        ...(prev ?? { stage: "Calculation", message: "" }),
                        stage: (prev && prev.stage) ? prev.stage : "Calculation",
                        message: data.progressDetails?.error || "An unknown error occurred during calculation."
                    }))
                }
            }
        } catch (error) {
            console.error("Error fetching payroll status:", error);
            setCalcStatus('error');
            setProgressDetails({ stage: 'Error', message: 'Could not fetch status updates.' });
            stopPolling();
        }
    }, [payrollRunId, accessToken, stopPolling]);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setCalcStatus('in-progress');
            setEmailStatus('pending');
            setFileStatus('pending');
            setOpenAccordion("step1");
            setProgressDetails(null);
            
            // Clear any old interval before starting a new one
            if (pollingIntervalIdRef.current) {
                clearInterval(pollingIntervalIdRef.current);
            }
            // Start a new polling interval
            pollingIntervalIdRef.current = setInterval(fetchStatus, 2500);
            fetchStatus(); // Initial fetch
        } else {
            // Cleanup on close
            stopPolling();
        }
        // Cleanup function for when component unmounts
        return () => stopPolling();
    }, [isOpen, fetchStatus, stopPolling]);


    const handleSendEmails = async () => {
        setEmailStatus('in-progress');
        try {
            await axios.post(`${API_BASE_URL}/payroll/send-payslips/${payrollRunId}`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.info("Payslip emailing has started in the background.");
            setEmailStatus('success');
            setOpenAccordion('step3');
        } catch (error) {
            toast.error("Failed to start the email sending process.");
            setEmailStatus('error');
        }
    };

    const handleSkipEmails = () => {
        setEmailStatus('skipped');
        setOpenAccordion('step3');
    };
    
    const handleGenerateFiles = async () => {
        setFileStatus('in-progress');
        try {
            const response = await axios.post(`${API_BASE_URL}/payroll/generate-bulk-files/${payrollRunId}`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let filename = `payroll_files_${payrollMonthYear}.zip`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success("Statutory files downloaded successfully!");
            setFileStatus('success');
        } catch (error) {
            toast.error("Failed to generate or download the files bundle.");
            setFileStatus('error');
        }
    };

    const handleFinish = () => {
        stopPolling();
        onProcessingComplete(calcStatus === 'success');
        onClose(true);
    };
    
    // (getStatusIcon function remains the same)
    const getStatusIcon = (status: StepStatus) => {
        switch (status) {
            case 'in-progress': return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
            case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'skipped': return <SkipForward className="h-5 w-5 text-gray-500" />;
            case 'pending': return <MailWarning className="h-5 w-5 text-yellow-500" />;
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleFinish(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl">Payroll Progress for {payrollMonthYear}</DialogTitle>
                    <DialogDescription>
                        Follow the steps below to complete the payroll process.
                    </DialogDescription>
                </DialogHeader>

                <Accordion type="single" collapsible value={openAccordion} onValueChange={setOpenAccordion} className="w-full">
                    <AccordionItem value="step1">
                        <AccordionTrigger className="text-base">
                            <div className="flex items-center gap-3">
                                {getStatusIcon(calcStatus)}
                                <span>1. Payroll Run</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-3">
                            {calcStatus === 'in-progress' && (
                                <>
                                    <p className="text-sm text-gray-600">{progressDetails?.message || 'Calculation is in progress...'}</p>
                                    {progressDetails?.progress !== undefined && <Progress value={progressDetails.progress} className="w-full [&>div]:bg-blue-500" />}
                                </>
                            )}
                            {calcStatus === 'success' && <p className="text-sm text-green-600 font-medium">{progressDetails?.message || 'Payroll calculation completed successfully.'}</p>}
                            {calcStatus === 'error' && <p className="text-sm text-red-600 font-medium">{progressDetails?.message || 'An error occurred during calculation.'}</p>}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step2" disabled={calcStatus !== 'success'}>
                        <AccordionTrigger className="text-base">
                            <div className="flex items-center gap-3">
                                {getStatusIcon(emailStatus)}
                                <span>2. Email Payslips</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-4">
                            <p className="text-sm text-gray-600">Send payslips to all active employees with a valid email address.</p>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={handleSkipEmails} disabled={emailStatus === 'in-progress' || emailStatus === 'success'}>Skip</Button>
                                <Button className="bg-[#7F5EFD] hover:bg-[#6a4fcf]" onClick={handleSendEmails} disabled={emailStatus === 'in-progress' || emailStatus === 'success'}>
                                    {emailStatus === 'in-progress' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Send Emails
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="step3" disabled={emailStatus === 'pending' || emailStatus === 'in-progress'}>
                        <AccordionTrigger className="text-base">
                             <div className="flex items-center gap-3">
                                {getStatusIcon(fileStatus)}
                                <span>3. Generate Statutory Files</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-4">
                             <p className="text-sm text-gray-600">Download a zip file containing the required statutory returns.</p>
                             <div className="flex justify-end gap-3">
                                 <Button variant="outline" onClick={() => setFileStatus('skipped')}>Skip</Button>
                                 <Button className="bg-[#7F5EFD] hover:bg-[#6a4fcf]" onClick={handleGenerateFiles} disabled={fileStatus === 'in-progress' || fileStatus === 'success'}>
                                    {fileStatus === 'in-progress' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                     Download .zip
                                 </Button>
                             </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <DialogFooter className="mt-4">
                    <Button variant="secondary" onClick={handleFinish}>Finish & Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PayrollProgressDialog;