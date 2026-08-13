// src/hooks/usePayslipOperations.ts

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { payslipService } from '@/services/payslipService';

export type LayoutOption = 'single' | 'two-up' | 'grid';
export type EmailStatus = 'idle' | 'sending' | 'complete' | 'failed';
export type EmailLogEntry = {
  employeeId: string;
  employeeName: string;
  email: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  timestamp: string;
};

interface UsePayslipOperationsProps {
  companyId: string;
  payrollRunId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePayslipOperations({
  companyId,
  onSuccess,
  onError,
}: UsePayslipOperationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailCompleted, setEmailCompleted] = useState(0);
  const [emailFailed, setEmailFailed] = useState(0);

  /**
   * Download a single payslip
   */
  const downloadPayslip = useCallback(
    async (payrollDetailId: string, preview: boolean = false) => {
      setIsLoading(true);
      try {
        const blob = await payslipService.downloadPayslip(
          companyId,
          payrollDetailId,
          preview
        );

        if (!preview) {
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `payslip_${payrollDetailId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('Payslip downloaded successfully');
        }

        return blob;
      } catch (error) {
        console.error('Error downloading payslip:', error);
        toast.error('Failed to download payslip');
        onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, onError]
  );

  /**
   * Download multiple payslips
   */
  const downloadMultiplePayslips = useCallback(
    async (employeeIds: string[], layout: LayoutOption = 'single', duplicate: boolean = false) => {
      setIsLoading(true);
      try {
        const blob = await payslipService.downloadMultiplePayslips(companyId, {
          employeeIds,
          layout,
          duplicate,
        });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslips_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`${employeeIds.length} payslips downloaded successfully`);
        onSuccess?.();
        return blob;
      } catch (error) {
        console.error('Error downloading payslips:', error);
        toast.error('Failed to download payslips');
        onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, onSuccess, onError]
  );

  /**
   * Preview payslips (get data for UI preview)
   */
  const previewPayslips = useCallback(
    async (employeeIds: string[], layout: LayoutOption = 'single', duplicate: boolean = false) => {
      setIsLoading(true);
      try {
        const data = await payslipService.previewPayslips(companyId, {
          employeeIds,
          layout,
          duplicate,
        });
        return data;
      } catch (error) {
        console.error('Error previewing payslips:', error);
        toast.error('Failed to preview payslips');
        onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, onError]
  );

  /**
   * Send a single payslip via email
   */
  const sendPayslipEmail = useCallback(
    async (payrollDetailId: string) => {
      setIsLoading(true);
      try {
        const response = await payslipService.emailPayslip(companyId, payrollDetailId);
        toast.success('Payslip sent successfully');
        onSuccess?.();
        return response;
      } catch (error) {
        console.error('Error sending payslip email:', error);
        toast.error('Failed to send payslip');
        onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, onSuccess, onError]
  );

  /**
   * Send multiple payslips via email with progress tracking
   */
  const sendMultiplePayslipEmails = useCallback(
    async (employeeIds: string[], layout: LayoutOption = 'single') => {
      setIsSendingEmail(true);
      setEmailStatus('sending');
      setEmailLogs([]);
      setEmailTotal(employeeIds.length);
      setEmailCompleted(0);
      setEmailFailed(0);

      // Initialize logs
      const initialLogs: EmailLogEntry[] = employeeIds.map((id) => ({
        employeeId: id,
        employeeName: 'Loading...',
        email: '',
        status: 'pending',
        timestamp: new Date().toISOString(),
      }));
      setEmailLogs(initialLogs);

      try {
        const response = await payslipService.emailMultiplePayslips(companyId, {
          employeeIds,
          layout,
        });

        // Update logs based on response
        const updatedLogs = employeeIds.map((id) => {
          const result = response.results.find((r) => r.employeeId === id);
          const failed = response.failed.find((f) => f.employeeId === id);
          
          if (result && result.status === 'success') {
            return {
              employeeId: result.employeeId,
              employeeName: result.employeeName,
              email: result.email,
              status: 'success' as const,
              timestamp: result.sentAt || new Date().toISOString(),
            };
          } else if (failed) {
            return {
              employeeId: failed.employeeId,
              employeeName: failed.employeeName,
              email: failed.email,
              status: 'failed' as const,
              error: failed.error,
              timestamp: new Date().toISOString(),
            };
          } else {
            return {
              employeeId: id,
              employeeName: 'Unknown',
              email: '',
              status: 'failed' as const,
              error: 'Unknown error',
              timestamp: new Date().toISOString(),
            };
          }
        });

        setEmailLogs(updatedLogs);
        setEmailCompleted(response.successCount);
        setEmailFailed(response.failedCount);

        if (response.failedCount === 0) {
          setEmailStatus('complete');
          toast.success(`All ${response.successCount} payslips sent successfully!`);
        } else if (response.successCount === 0) {
          setEmailStatus('failed');
          toast.error('All emails failed to send');
        } else {
          setEmailStatus('failed');
          toast.warning(`${response.successCount} sent, ${response.failedCount} failed`);
        }

        onSuccess?.();
        return response;
      } catch (error) {
        console.error('Error sending payslips:', error);
        setEmailStatus('failed');
        toast.error('Failed to send payslips');
        onError?.(error as Error);
        throw error;
      } finally {
        setIsSendingEmail(false);
      }
    },
    [companyId, onSuccess, onError]
  );

  /**
   * Mark payslip as sent
   */
  const markAsSent = useCallback(
    async (payrollDetailId: string) => {
      setIsLoading(true);
      try {
        const response = await payslipService.markPayslipSent(companyId, payrollDetailId);
        toast.success('Payslip marked as sent');
        onSuccess?.();
        return response;
      } catch (error) {
        console.error('Error marking payslip as sent:', error);
        toast.error('Failed to mark payslip as sent');
        onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, onSuccess, onError]
  );

  /**
   * Mark multiple payslips as sent
   */
  const markMultipleAsSent = useCallback(
    async (payrollDetailsIds: string[], payrollRunId: string) => {
      setIsLoading(true);
      try {
        const response = await payslipService.markPayslipsSent(companyId, payrollDetailsIds, payrollRunId);
        toast.success(`${payrollDetailsIds.length} payslips marked as sent`);
        onSuccess?.();
        return response;
      } catch (error) {
        console.error('Error marking payslips as sent:', error);
        toast.error('Failed to mark payslips as sent');
        onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, onSuccess, onError]
  );

  /**
   * Update payslip status (sent/unsent)
   */
  const updateStatus = useCallback(
    async (payrollDetailId: string, status: 'sent' | 'unsent') => {
      setIsLoading(true);
      try {
        const response = await payslipService.updatePayslipStatus(
          companyId,
          payrollDetailId,
          status
        );
        toast.success(`Payslip marked as ${status}`);
        onSuccess?.();
        return response;
      } catch (error) {
        console.error('Error updating payslip status:', error);
        toast.error('Failed to update payslip status');
        onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, onSuccess, onError]
  );

  /**
   * Get payslip status
   */
  const getStatus = useCallback(
    async (payrollDetailId: string) => {
      try {
        const response = await payslipService.getPayslipStatus(companyId, payrollDetailId);
        return response.status;
      } catch (error) {
        console.error('Error getting payslip status:', error);
        toast.error('Failed to get payslip status');
        throw error;
      }
    },
    [companyId]
  );

  /**
   * Reset email state
   */
  const resetEmailState = useCallback(() => {
    setEmailStatus('idle');
    setEmailLogs([]);
    setEmailTotal(0);
    setEmailCompleted(0);
    setEmailFailed(0);
  }, []);

  return {
    isLoading,
    isSendingEmail,
    emailStatus,
    emailLogs,
    emailTotal,
    emailCompleted,
    emailFailed,
    downloadPayslip,
    downloadMultiplePayslips,
    previewPayslips,
    sendPayslipEmail,
    sendMultiplePayslipEmails,
    markAsSent,
    markMultipleAsSent,
    updateStatus,
    getStatus,
    resetEmailState,
  };
}