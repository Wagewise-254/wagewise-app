import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Calendar,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PreparationLayout from "@/pages/company/payroll/runs/PayrollPreparationLayout";
import PayrollApprovalTable from "@/pages/company/payroll/runs/PayrollApprovalTable";
import PayrollPaymentTable from "@/pages/company/payroll/runs/PayrollPaymentTable";
import PayrollPayslipTable from "@/pages/company/payroll/runs/PayrollPayslip";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";

// Define interface for payroll info
interface PayrollInfo {
  payroll_month: string;
  payroll_year: number;
  payroll_number: string;
  status: string;
}

// Enhanced Minimal Stepper Component with better active state
function MinimalStepper({
  currentStep,
  payrollInfo,
}: {
  currentStep: number;
  payrollInfo?: PayrollInfo | null;
}) {
  const steps = [
    { number: 1, label: "Prepare" },
    { number: 2, label: "Review" },
    { number: 3, label: "Payments" },
    { number: 4, label: "Payslips" },
  ];

  // Format month display
  const formattedMonth = payrollInfo
    ? `${payrollInfo.payroll_month} ${payrollInfo.payroll_year}`
    : "Loading...";

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.number} className="flex items-center">
            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center text-xs font-medium transition-all duration-300",
                  isActive && "scale-110 text-indigo-600 font-semibold",
                  isCompleted && "text-indigo-500",
                  !isActive && !isCompleted && "text-slate-400",
                )}
              >
                {/* Active step indicator dot */}
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2">
                    <Circle className="h-1.5 w-1.5 fill-indigo-600 text-indigo-600 animate-pulse" />
                  </span>
                )}

                <span
                  className={cn(
                    "hidden sm:inline relative",
                    isActive &&
                      "after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-full",
                  )}
                >
                  {step.label}
                </span>
                <span className="sm:hidden">{step.number}</span>
              </div>

              {/* Show payroll month badge - only show once */}
              {step.number === 1 && payrollInfo && (
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-700 border-0 text-[10px] px-1.5 py-0.5 font-normal ml-1"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {formattedMonth}
                </Badge>
              )}
            </div>

            {/* Separator line - only between steps */}
            {!isLast && (
              <div
                className={cn(
                  "w-6 sm:w-12 h-px mx-2 transition-colors duration-300",
                  currentStep > step.number ? "bg-indigo-300" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PayrollWizard() {
  const [currentStep, setCurrentStep] = useState(1); // Start at review
  const [payrollInfo, setPayrollInfo] = useState<PayrollInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId, payrollRunId } = useParams<{
    companyId: string;
    payrollRunId: string;
  }>();
  const { session } = useAuthStore();

  const totalSteps = 4;

  // Fetch payroll info on mount
  useEffect(() => {
    const fetchPayrollInfo = async () => {
      if (!companyId || !payrollRunId || !session?.access_token) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/company/${companyId}/payroll/runs/${payrollRunId}/review-summary`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        if (response.data?.payroll) {
          setPayrollInfo(response.data.payroll);
        }
      } catch (error) {
        console.error("Failed to fetch payroll info:", error);
        toast.error("Could not load payroll information");
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollInfo();
  }, [companyId, payrollRunId, session]);

  // Check for step from location state (if coming from review-status with a specific step)
  useEffect(() => {
    if (location.state?.step) {
      setCurrentStep(location.state.step);
    }
  }, [location.state]);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isLastStep = currentStep === totalSteps;

  // Render the appropriate table based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PreparationLayout />;
      case 2:
        return <PayrollApprovalTable />;
      case 3:
        return <PayrollPaymentTable />;
      case 4:
        return <PayrollPayslipTable />;
      default:
        return null;
    }
  };

  // Get step title for mobile display
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Preparation";
      case 2:
        return "Review";
      case 3:
        return "Payments";
      case 4:
        return "Payslips";
      default:
        return "";
    }
  };

  // Add this before the return statement, after the hooks
if (loading) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-slate-600">Loading payroll information...</p>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Ultra-minimal header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left section with back button and title */}
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-slate-100"
                    onClick={() =>
                      navigate(
                        `/company/${companyId}/payroll/${payrollRunId}/review-status`,
                      )
                    }
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Back to review status</p>
                </TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-slate-200" />

              <h1 className="text-sm font-medium text-slate-900">
                Payroll Run
              </h1>

              {/* Show payroll number on larger screens */}
              {payrollInfo?.payroll_number && (
                <>
                  <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                  <Badge
                    variant="outline"
                    className="hidden sm:inline-flex border-slate-200 text-xs font-normal"
                  >
                    #{payrollInfo.payroll_number}
                  </Badge>
                </>
              )}
            </div>

            {/* Center - Minimal Stepper */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
              <MinimalStepper
                currentStep={currentStep}
                payrollInfo={payrollInfo}
              />
            </div>

            {/* Right section - empty for balance */}
            <div className="w-22" />
          </div>
        </div>
      </div>

      {/* Main Content - Flexible to push footer down */}
      <div className="flex-1">
        <div className="px-2 sm:px-2 lg:px-4 py-2">
          {/* Mobile header with step info */}
          <div className="md:hidden mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className="bg-indigo-50 text-indigo-700"
              >
                Step {currentStep} of {totalSteps}
              </Badge>
              <div className="text-xs text-slate-500">
                {getStepTitle()} Stage
              </div>
            </div>

            {/* Mobile payroll info */}
            {payrollInfo && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>
                  {payrollInfo.payroll_month} {payrollInfo.payroll_year}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="font-mono">#{payrollInfo.payroll_number}</span>
              </div>
            )}
          </div>

          {/* Dynamic Content - Table takes full width */}
          <div className="bg-white rounded-sm shadow-none border border-slate-200/80 overflow-hidden">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Sticky Footer Navigation - Always at bottom */}
      <div className="sticky bottom-0 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl mt-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={cn(
                "gap-1.5 text-slate-500 hover:text-slate-900 text-xs h-8 px-2 transition-all",
                currentStep === 1 && "opacity-50 cursor-not-allowed",
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-900 text-xs h-8 px-3"
                onClick={() =>
                  navigate(`/company/${companyId}/payroll/history`)
                }
              >
                Save & Exit
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  if (isLastStep) {
                    // Navigate to the specific payroll run reports page with state
                    navigate(
                      `/company/${companyId}/reports/payroll-run/${payrollRunId}`,
                      {
                        state: { fromWizard: true, payrollRunId },
                      },
                    );
                  } else {
                    nextStep();
                  }
                }}
                className={cn(
                  "h-8 px-4 text-xs font-medium transition-all hover:-translate-y-0.5",
                  isLastStep
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white",
                )}
              >
                {isLastStep ? "View Reports" : "Continue"}
                {!isLastStep && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
