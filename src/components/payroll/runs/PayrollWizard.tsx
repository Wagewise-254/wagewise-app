import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronRight, ChevronLeft, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import PreparationLayout from "@/pages/company/payroll/runs/PayrollPreparationLayout";
import PayrollApprovalTable from "@/pages/company/payroll/runs/PayrollApprovalTable";
import PayrollPaymentTable from "@/pages/company/payroll/runs/PayrollPaymentTable";
import PayrollPayslipTable from "@/pages/company/payroll/runs/PayrollPayslip..tsx";

// Top Stepper Component
function TopStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, title: "Prepare" },
    { number: 2, title: "Review" },
    { number: 3, title: "Payments" },
    { number: 4, title: "Payslips" },
  ];

  return (
    <div className="relative mt-2">
      {/* Background line - behind the circles */}
      <div className="absolute top-3.5 left-0 w-full h-0.5 bg-slate-100 z-0" />

      {/* Progress line */}
      <div
        className="absolute top-3.5 left-0 h-0.5 bg-indigo-600 transition-all duration-500 z-0"
        style={{
          width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
        }}
      />

      <div className="relative flex justify-between z-10">
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center group">
              {/* Circle Container */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white", 
                  // bg-white above hides the line behind the circle
                  isCompleted 
                    ? "bg-indigo-600 border-indigo-600 text-white" 
                    : isActive 
                    ? "border-indigo-600 text-indigo-600 " 
                    : "border-slate-200 text-slate-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3px]" />
                ) : (
                  <span className="text-xs font-bold">{step.number}</span>
                )}
              </div>

              {/* Title */}
              <span
                className={cn(
                  "mt-2 text-[11px] font-semibold tracking-wider transition-colors",
                  isActive || isCompleted ? "text-indigo-900" : "text-slate-400"
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PayrollWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { companyId, payrollRunId } = useParams<{
    companyId: string;
    payrollRunId: string;
  }>();
  const totalSteps = 4;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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

  return (
    <main className="h-screen flex flex-col bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-2 py-3">
          <div className="flex items-center justify-between mb-3">
            <Tooltip>
              <TooltipTrigger asChild className="absolute left-6 top-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/company/${companyId}/payroll/${payrollRunId}/review-status`,
                    )
                  }
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Back</p>
              </TooltipContent>
            </Tooltip>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                    Payroll Run
                  </h1>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border-0"
                >
                  Step {currentStep} / {totalSteps}
                </Badge>
              </div>

              {/* Top Stepper */}
              <TopStepper currentStep={currentStep} />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Dynamic Content */}
          <div className="min-h-100">{renderStepContent()}</div>
        </div>
      </div>

      {/* Sticky Footer Navigation */}
      <div className="sticky bottom-0 z-10 bg-white border-t border-slate-200 ">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="text-slate-600 border-slate-300 cursor-pointer hover:bg-slate-50"
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
                    // Navigate to reports on the final step
                    navigate(`/company/${companyId}/reports/overview`);
                  } else {
                    nextStep();
                  }
                }}
                className={cn(
                  "transition-all duration-300 gap-1.5 px-5 cursor-pointer",
                  isLastStep 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100" 
                    : "bg-indigo-700 hover:bg-indigo-800 text-white"
                )}
              >
                {isLastStep ? "View Final Reports" : "Continue"}
                {!isLastStep && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
