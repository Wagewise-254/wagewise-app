import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";
import { OtherDeductionsTable } from "./DeductionsTable";
import { AllowanceTable } from "./BenefitsTable";

function StatutoryDeductions(){

    const statutoryDeductions = [
    { name: "PAYE", type: "Formula", value: "Custom" },
    { name: "NSSF", type: "New Rates (Tier I & II)", value: "Custom" },
    { name: "SHIF", type: "Formula", value: "Custom" },
    { name: "Housing Levy", type: "Formula", value: "Custom" },
  ];
    return(
        <div className="space-y-6">              
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-900">Name</th>
                      <th className="px-6 py-3 font-semibold text-slate-900">Assigned As</th>
                      <th className="px-6 py-3 font-semibold text-slate-900">Type</th>
                      <th className="px-6 py-3 font-semibold text-slate-900">Value</th>
                      <th className="px-6 py-3 font-semibold text-slate-900">Frequency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {statutoryDeductions.map((item) => (
                      <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700">{item.name}</td>
                        <td className="px-6 py-4 text-slate-500 underline decoration-dotted">Default</td>
                        <td className="px-6 py-4 text-slate-500">{item.type}</td>
                        <td className="px-6 py-4 text-slate-500">{item.value}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700">
                            Every payroll cycle
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
    )
}

function ReviewersTable() {
    const fullName = useAuthStore.getState().activeWorkspace?.full_names || "";
  return (
    <div className="space-y-6">
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-slate-900">
                Reviewer
              </th>
              <th className="px-6 py-3 font-semibold text-slate-900">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-700">
                {fullName || "User"}
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-[#1F3A8A]">
                  Owner • You
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-500">
        Additional reviewers can be added after inviting team members to your
        workspace.
      </div>
    </div>
  );
}

export default function PayrollSetup() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
   const { companyId } = useParams<{companyId: string;}>();

  const totalSteps = 4;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
    // logic for "save " will go here
    else setDone(true);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else navigate("/dashboard");
  };

  useEffect(() => {
    if (done) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [done]);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        {/* Sidebar Stepper - Sticky */}
        <div className="md:col-span-4 lg:col-span-3 sticky top-12 space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payroll Setup Guide</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your payroll items
            </p>
          </div>

          <VerticalStepper step={step} />

          <Button
            variant="ghost"
            onClick={prevStep}
            className="text-muted-foreground hover:text-foreground p-0 h-auto cursor-pointer"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {step === 1 ? "Back to Dashboard" : "Previous step"}
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-8 lg:col-span-9">
          <Card className="bg-white dark:bg-background border border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pt-10 px-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-50 text-[#1F3A8A] text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Step {step}
                </span>
              </div>
              <CardTitle className="text-3xl font-bold">
                {step === 1 && "Statutory Settings"}
                {step === 2 && "Other Deductions"}
                {step === 3 && "Benefits Configuration"}
                {step === 4 && "Payroll Reviewers"}
              </CardTitle>

              <CardDescription className="text-base">
                {step === 1 &&
                  "Government-mandated deductions applied automatically to every payroll cycle."}
                {step === 2 &&
                  "Define additional recurring deductions such as loans or penalties."}
                {step === 3 &&
                  "Configure employee benefits and non-cash compensation."}
                {step === 4 &&
                  "Assign payroll reviewers responsible for approval before processing."}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-10">
              {/* Dynamic Form Content */}
              <div className="min-h-75">
                {step === 1 && <StatutoryDeductions />}
                {step === 2 && <OtherDeductionsTable companyId={companyId as string} />}
                {step === 3 && <AllowanceTable companyId={companyId as string} />}
                {step === 4 && <ReviewersTable />}
              </div>

              {/* Navigation Actions */}
              <div className="mt-10 flex justify-end">
                <Button
                  onClick={nextStep}
                  className="bg-[#1F3A8A] hover:bg-[#162a63] px-5 h-12 rounded-lg text-md font-semibold transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  {step === totalSteps ? "Finish Setup" : "Continue"}
                  {step !== totalSteps && (
                    <ChevronRight className="ml-2 h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion Modal */}
      <Dialog open={done} onOpenChange={() => {}}>
        <DialogContent className="text-center p-0 overflow-hidden sm:max-w-md rounded-[2.5rem] border-none shadow-xl">
          <div className="p-12">
            {/* Animated Icon Container */}
            <div className="relative mx-auto mb-10 h-24 w-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-green-100 blur-xl opacity-60" />
              <div className="relative h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2
                  className="h-11 w-11 text-green-500"
                  strokeWidth={2.25}
                />
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-3xl font-bold text-slate-900 tracking-tight">
                Payroll setup complete
              </DialogTitle>
            </DialogHeader>

            <p className="mt-4 text-slate-500 text-base leading-relaxed max-w-sm mx-auto">
              Your payroll configuration has been successfully initialized. You
              can now onboard employees and start running payroll cycles.
            </p>

            <div className="mt-12 space-y-4">
              <Button
                className="w-full bg-[#1F3A8A] hover:bg-[#162a63] h-14 cursor-pointer rounded-lg text-base font-semibold shadow-md transition-all hover:-translate-y-px"
                onClick={() => navigate(`/company/${companyId}/employees`)}
              >
                Onboard Employees
              </Button>

              <Button
                variant="ghost"
                className="w-full h-12 rounded-lg text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VerticalStepper({ step }: { step: number }) {
  const steps = [
    { title: "Statutory", icon: <ShieldCheck size={18} /> },
    { title: "Deductions", icon: <Layers size={18} /> },
    { title: "Benefits", icon: <Briefcase size={18} /> },
    { title: "Reviewers", icon: <CheckCircle2 size={18} /> },
  ];

  return (
    <nav className="flex flex-col gap-2">
      {steps.map((s, i) => {
        const isActive = step === i + 1;
        const isCompleted = step > i + 1;

        return (
          <div
            key={s.title}
            className="relative flex items-start gap-4 pb-8 last:pb-0"
          >
            {/* Vertical Line Connector */}
            {i !== steps.length - 1 && (
              <div
                className={`absolute left-5 top-10 w-0.5 h-[calc(100%-20px)] transition-colors duration-500
                ${isCompleted ? "bg-green-500" : "bg-slate-200"}`}
              />
            )}

            <div
              className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
              ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isActive
                    ? "bg-[#1F3A8A] text-white shadow-lg scale-110"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {isCompleted ? <CheckCircle2 size={20} /> : s.icon}
            </div>

            <div className="flex flex-col pt-1">
              <span
                className={`text-sm font-bold transition-colors
                ${isActive ? "text-[#1F3A8A]" : isCompleted ? "text-green-600" : "text-slate-400"}`}
              >
                {s.title}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {isCompleted
                  ? "Completed"
                  : isActive
                    ? "In Progress"
                    : "Pending"}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
