// src/services/payslipService.ts
import api from './api';
import { AxiosResponse } from 'axios';
import { AllowanceDetail, DeductionDetail } from '@/pages/company/payroll/reviews/types';

export interface PayslipEmployee {
  id: string;
  employee_name: string;
  employee_number: string;
  email: string;
  job_title: string | null;
  department_name: string | null;
  net_pay: number;
  payslip_generated_at: string | null;
  payslip_sent_at: string | null;
  payslip_viewed_at: string | null;
  review_status: string;
}

export interface BulkPayslipRequest {
  employeeIds: string[];
  layout: 'single' | 'two-up' | 'grid' | 'duplicate'; // Add 'duplicate'
  duplicate?: boolean;
}

export interface EmailResponse {
  message: string;
  data?: {
    employeeId: string;
    email: string;
    sentAt: string;
  };
}

export interface BulkEmailResponse {
  message: string;
  total: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    employeeId: string;
    employeeName: string;
    email: string;
    status: 'success' | 'failed';
    sentAt?: string;
    error?: string;
  }>;
  failed: Array<{
    employeeId: string;
    employeeName: string;
    email: string;
    error: string;
  }>;
}

export interface PayslipStatusResponse {
  status: {
    generated: boolean;
    sent: boolean;
    sent_method: string | null;
    viewed: boolean;
    downloaded: boolean;
    generated_at: string | null;
    sent_at: string | null;
    viewed_at: string | null;
    downloaded_at: string | null;
    employee: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface DeliveryLogResponse {
  logs: Array<{
    payslipId: string;
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    email: string;
    sentAt: string;
    sentMethod: string;
    viewedAt: string | null;
    downloadedAt: string | null;
    status: string;
  }>;
  total: number;
}

export interface PreviewResponse {
  data: Array<{
    id: string;
    employee_id: string;
    employee_name: string;
    employee_number: string;
    email: string;
    job_title: string | null;
    department_name: string | null;
    net_pay: number;
    payslip_generated_at: string | null;
    payslip_sent_at: string | null;
    payslip_viewed_at: string | null;
    review_status: string;
    payroll_month: string;
    payroll_year: number;
    company_name: string;
    logo_url: string | null;
    basic_salary: number;
    gross_pay: number;
    total_deductions: number;
    paye_tax: number;
    nssf_deduction: number;
    shif_deduction: number;
    housing_levy_deduction: number;
    helb_deduction: number;
    allowances_details: AllowanceDetail[];
    deductions_details: DeductionDetail[];
    payment_method: string;
    bank_name: string;
    account_name: string;
  }>;
  layout: string;
  duplicate: boolean;
  total: number;
}

class PayslipService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/company';
  }

  /**
   * Get a single payslip PDF
   */
  async downloadPayslip(
    companyId: string,
    payrollDetailId: string,
    preview: boolean = false
  ): Promise<Blob> {
    const response = await api.get(
      `${this.baseUrl}/${companyId}/payroll/payslip/${payrollDetailId}/download`,
      {
        params: { preview },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Email a single payslip
   */
  async emailPayslip(
    companyId: string,
    payrollDetailId: string
  ): Promise<EmailResponse> {
    const response = await api.post(
      `${this.baseUrl}/${companyId}/payroll/payslip/${payrollDetailId}/email`
    );
    return response.data;
  }

  /**
   * Download multiple payslips
   */
  async downloadMultiplePayslips(
    companyId: string,
    request: BulkPayslipRequest
  ): Promise<Blob> {
    const response = await api.post(
      `${this.baseUrl}/${companyId}/payroll/payslip/bulk/download`,
      request,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Email multiple payslips
   */
  async emailMultiplePayslips(
    companyId: string,
    request: BulkPayslipRequest
  ): Promise<BulkEmailResponse> {
    const response = await api.post(
      `${this.baseUrl}/${companyId}/payroll/payslip/bulk/email`,
      request
    );
    return response.data;
  }

  /**
   * Preview payslips (returns JSON data for frontend rendering)
   */
  async previewPayslips(
    companyId: string,
    request: BulkPayslipRequest
  ): Promise<PreviewResponse> {
    const response = await api.post(
      `${this.baseUrl}/${companyId}/payroll/payslip/bulk/preview`,
      request
    );
    return response.data;
  }

  /**
   * Mark a single payslip as sent
   */
  async markPayslipSent(companyId: string, payrollDetailId: string): Promise<AxiosResponse> {
    const response = await api.put(
      `${this.baseUrl}/${companyId}/payroll/payslip/${payrollDetailId}/mark-sent`
    );
    return response.data;
  }

  /**
   * Mark multiple payslips as sent
   */
 async markPayslipsSent(companyId: string, payrollDetailsIds: string[], payrollRunId: string): Promise<AxiosResponse> {
  const response = await api.post(
    `${this.baseUrl}/${companyId}/payroll/payslip/bulk/mark-sent`,
    { payrollDetailsIds, payrollRunId }
  );
  return response.data;
}

  /**
   * Mark payslip as viewed
   */
  async markPayslipViewed(companyId: string, payrollDetailId: string): Promise<AxiosResponse> {
    const response = await api.put(
      `${this.baseUrl}/${companyId}/payroll/payslip/${payrollDetailId}/mark-viewed`
    );
    return response.data;
  }

  /**
   * Mark payslip as downloaded
   */
  async markPayslipDownloaded(companyId: string, payrollDetailId: string): Promise<AxiosResponse> {
    const response = await api.put(
      `${this.baseUrl}/${companyId}/payroll/payslip/${payrollDetailId}/mark-downloaded`
    );
    return response.data;
  }

  /**
   * Update payslip status (sent/unsent)
   */
  async updatePayslipStatus(
    companyId: string,
    payrollDetailId: string,
    status: 'sent' | 'unsent'
  ): Promise<AxiosResponse> {
    const response = await api.put(
      `${this.baseUrl}/${companyId}/payroll/payslip/${payrollDetailId}/status`,
      { status }
    );
    return response.data;
  }

  /**
   * Get payslip status
   */
  async getPayslipStatus(
    companyId: string,
    payrollDetailId: string
  ): Promise<PayslipStatusResponse> {
    const response = await api.get(
      `${this.baseUrl}/${companyId}/payroll/payslip/${payrollDetailId}/status`
    );
    return response.data;
  }

  /**
   * Get delivery logs
   */
  async getDeliveryLogs(
    companyId: string,
    params?: { payrollRunId?: string; employeeId?: string }
  ): Promise<DeliveryLogResponse> {
    const response = await api.get(
      `${this.baseUrl}/${companyId}/payroll/payslip/bulk/delivery-logs`,
      { params }
    );
    return response.data;
  }
}

export const payslipService = new PayslipService();