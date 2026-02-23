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
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Building2,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Layers,
  Settings2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import confetti from "canvas-confetti";
import axios from "axios";
import { API_BASE_URL } from "@/config";

import { CompanyProfileForm } from "./CompanyProfileForm";
import { DepartmentsTable } from "./DepartmentsTable";
import { SubDepartmentsTable } from "./SubDepartmentsTable";
import { JobTitlesTable } from "./JobTitlesTable";
import { toast } from "sonner";

export interface Branch {
  name: string;
  branch_code: string;
  full_code: string;
}

export interface Bank {
  bank_code: string;
  name: string;
  branches: Branch[];
}

export interface CompanyFormData {
  [key: string]: string;
  // Business Info
  business_name: string;
  industry: string;
  kra_pin: string;
  company_email: string;
  company_phone: string;
  location: string;

  // Statutory
  nssf_employer: string;
  shif_employer: string;
  housing_levy_employer: string;
  helb_employer: string;

  // Bank Details
  bank_name: string;
  branch_name: string;
  account_name: string;
  account_number: string;
}

export default function CompanySetup() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const navigate = useNavigate();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<CompanyFormData>({
    business_name: "",
    industry: "",
    kra_pin: "",
    company_email: "",
    company_phone: "",
    location: "",
    nssf_employer: "",
    shif_employer: "",
    housing_levy_employer: "",
    helb_employer: "",
    bank_name: "",
    branch_name: "",
    account_name: "",
    account_number: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const totalSteps = 4;

  const handleSaveCompany = async () => {
    setLoading(true);
    try {
      const session = useAuthStore.getState().session;
      const token = session?.access_token;

      const formData = new FormData();
      Object.keys(companyData).forEach((key) =>
        formData.append(key, companyData[key]),
      );
      // Append logo if exists
      if (logoFile) formData.append("logo", logoFile);
      const workspace_id =
        useAuthStore.getState().activeWorkspace?.workspace_id || "";

      console.log(workspace_id);

      // Assuming workspace_id comes from your auth/context
      formData.append("workspace_id", workspace_id);

      const response = await axios.post(`${API_BASE_URL}/company`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Required for file uploads
        },
      });
      setCompanyId(response.data.id);
      toast.success("Company Saved");
      setStep(2); // Move to departments
    } catch (error) {
      toast.error("Save failed");
      console.error("Save failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    // Trigger a refresh of the workspace context to show the new company on the dashboard
    await useAuthStore.getState().loadContext();
    navigate("/dashboard");
  };

  const nextStep = () => {
    if (step === 1 && !companyId) {
      handleSaveCompany();
    } else if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
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
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        {/* Sidebar Stepper - Sticky */}
        <div className="md:col-span-4 lg:col-span-3 sticky top-12 space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Setup Guide</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your workspace
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
                {step === 1 && "Company Profile"}
                {step === 2 && "Departments"}
                {step === 3 && "Projects & Units"}
                {step === 4 && "Job Titles"}
              </CardTitle>
              <CardDescription className="text-base">
                {step === 1 &&
                  "Enter your basic business and statutory information."}
                {step === 2 &&
                  "Organize your company into high-level departments."}
                {step === 3 &&
                  "Define specific projects or sub-units within departments."}
                {step === 4 &&
                  "List the roles and job titles used in your organization."}
              </CardDescription>
            </CardHeader>

           <CardContent className="p-10">
              {/* Dynamic Form Content */}
              <div className="min-h-75">
                {step === 1 && (
                  <CompanyProfileForm
                    data={companyData}
                    setData={setCompanyData}
                    setLogoFile={setLogoFile}
                    logoPreview={logoPreview}
                    setLogoPreview={setLogoPreview}
                  />
                )}
                {step === 2 && (
                  <DepartmentsTable
                    companyId={companyId!}
                    onDepartmentsChange={setDepartments}
                  />
                )}
                {step === 3 && (
                  <SubDepartmentsTable
                    companyId={companyId!}
                    departments={departments}
                  />
                )}
                {step === 4 && <JobTitlesTable companyId={companyId!} />}
              </div>

              {/* Navigation Actions */}
              <div className="mt-12 flex justify-end">
                <Button
                  onClick={nextStep}
                  disabled={loading}
                  className="bg-[#1F3A8A] hover:bg-[#162a63] px-5 h-12 rounded-lg text-md font-semibold shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  {loading
                    ? "Saving..."
                    : step === totalSteps
                      ? "Finish Setup"
                      : "Save & Continue"}
                  {!loading && step !== totalSteps && (
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
                Setup Submitted
              </DialogTitle>
            </DialogHeader>

            <p className="mt-4 text-slate-500 text-base leading-relaxed max-w-sm mx-auto">
              Your company profile has been created successfully. Our team will
              review the details shortly. In the meantime, you can manage your
              workspace settings from the dashboard.
            </p>

            <div className="mt-12">
              <Button
                className="w-full bg-[#1F3A8A] hover:bg-[#162a63] h-14 rounded-2xl text-base font-semibold shadow-md transition-all hover:-translate-y-px"
                onClick={handleFinish}
              >
                Return to Dashboard
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
    { title: "Profile", icon: <Building2 size={18} /> },
    { title: "Departments", icon: <Layers size={18} /> },
    { title: "Units", icon: <Settings2 size={18} /> },
    { title: "Titles", icon: <Briefcase size={18} /> },
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
