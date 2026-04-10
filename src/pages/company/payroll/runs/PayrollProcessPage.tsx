// src/pages/company/payroll/PayrollProcessPage.tsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";

export default function PayrollProcessPage() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { companyId, payrollRunId } = useParams();
  const [searchParams] = useSearchParams();
  
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  
  const [processing, setProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processPayroll = useCallback(async () => {
    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            month,
            year,
            payrollRunId,
          }),
        }
      );
      
      clearInterval(interval);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to process payroll");
      }
      
      setProgress(100);
      toast.success("Payroll processed successfully!");
      
      setTimeout(() => {
        navigate(`/company/${companyId}/payroll/${payrollRunId}/review-status`);
      }, 1500);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("An unknown error occurred");
        toast.error("An unknown error occurred");
      }
    } finally {
      setProcessing(false);
    }
  }, [companyId, month, year, payrollRunId, session?.access_token, navigate]);

  useEffect(() => {
    processPayroll();
  }, [processPayroll]);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-12 text-center">
          <Ban className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-red-900 mb-2">Processing Failed</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <Button onClick={() => navigate(`/company/${companyId}/payroll/eligibility?month=${month}&year=${year}`)}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-12 text-center">
        {processing ? (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-[#1F3A8A] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Processing Payroll</h2>
            <p className="text-slate-500 mb-6">
              Calculating salaries, taxes, and deductions for {month} {year}
            </p>
            <div className="max-w-md mx-auto">
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-slate-500">{progress}% complete</p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-green-900 mb-2">Payroll Processed!</h2>
            <p className="text-green-700 mb-6">
              Redirecting to review page...
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}