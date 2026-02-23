import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Layers,
} from "lucide-react";
import { DepartmentsTable } from "@/components/dashboard/DepartmentsTable";
import { SubDepartmentsTable } from "@/components/dashboard/SubDepartmentsTable";

export default function DepartmentSettings() {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const { companyId } = useParams<{ companyId: string }>();

  const totalSteps = 2;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Check if sub-departments can be added (requires at least one department)
  //const hasDepartments = departments.length > 0;

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 h-full">
        {/* Sidebar Stepper - Sticky */}
        <div className="md:col-span-4 lg:col-span-3 h-full">
          <div className="sticky top-0 space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                HRM Setup
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                2-step configuration
              </p>
            </div>

            <VerticalStepper step={step} />

            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={step === 1}
              className="text-muted-foreground hover:text-foreground p-0 h-auto text-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              Previous
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-8 lg:col-span-9">
          <Card className="bg-white dark:bg-background border border-border shadow-sm rounded-xl overflow-hidden ">
            <CardHeader className="pt-6 px-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-blue-50 text-[#1F3A8A] text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Step {step} of {totalSteps}
                </span>
              </div>
              <CardTitle className="text-2xl font-bold">
                {step === 1 && "Departments"}
                {step === 2 && "Sub-departments & Units"}
              </CardTitle>

              <CardDescription className="text-sm">
                {step === 1 &&
                  "Create departments to organize your company structure."}
                {step === 2 &&
                  "Add specific units or projects under existing departments."}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-10">
              {/* Dynamic Form Content */}
              <div className="min-h-75">
                {step === 1 && (
                  <DepartmentsTable
                    companyId={companyId!}
                    onDepartmentsChange={setDepartments}
                  />
                )}
                {step === 2 && (
                  <SubDepartmentsTable
                    companyId={companyId!}
                    departments={departments}
                  />
                )}
              </div>
            </CardContent>

            {/* Navigation Actions - Fixed at bottom of card */}
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 shrink-0">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                  className="px-5 h-10 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <Button
                  onClick={nextStep}
                  disabled={step === 2}
                  className="bg-[#1F3A8A] hover:bg-[#162a63] px-5 h-10 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VerticalStepper({ step }: { step: number }) {
  const steps = [
    { title: "Departments", icon: <Layers size={16} /> },
    { title: "Sub-departments", icon: <Settings2 size={16} /> },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {steps.map((s, i) => {
        const isActive = step === i + 1;
        const isCompleted = step > i + 1;
        const stepNumber = i + 1;

        return (
          <div
            key={s.title}
            className="relative flex items-start gap-3 pb-6 last:pb-0"
          >
            {/* Vertical Line Connector */}
            {i !== steps.length - 1 && (
              <div
                className={`absolute left-4 top-8 w-0.5 h-[calc(100%-20px)] transition-colors duration-500
                ${isCompleted ? "bg-green-500" : "bg-slate-200"}`}
              />
            )}

            <div
              className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 text-xs
              ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isActive
                    ? "bg-[#1F3A8A] text-white shadow-md"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {isCompleted ? <CheckCircle2 size={14} /> : stepNumber}
            </div>

            <div className="flex flex-col pt-0.5">
              <span
                className={`text-xs font-semibold transition-colors
                ${isActive ? "text-[#1F3A8A]" : isCompleted ? "text-green-600" : "text-slate-500"}`}
              >
                {s.title}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {isCompleted ? "Completed" : isActive ? "Current" : "Pending"}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
