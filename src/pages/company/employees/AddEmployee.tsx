import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Briefcase,
  ShieldCheck,
  Banknote,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FloatingField,
  FloatingSearchableSelect,
  SectionHeader,
  ToggleRow,
} from "@/components/company/employees/employeeutils";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";

// --- Types & Interfaces ---

interface BankBranch {
  name: string;
  branch_code: string;
  full_code: string;
}

interface Bank {
  bank_code: string;
  name: string;
  branches: BankBranch[];
}

interface DropdownItem {
  id: string;
  name?: string;
  title?: string;
}

interface EmployeeFormData {
  // Personal Info
  employee_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  marital_status: string;
  citizenship: string;
  id_type: string;
  id_number: string;
  has_disability: boolean;

  // Employment
  department_id: string;
  sub_department_id: string;
  job_title_id: string;
  hire_date: string;
  job_type: string;
  employee_status: string;
  employee_status_effective_date: string;
  employee_type: string;
  salary: number;

  // Statutory
  pays_paye: boolean;
  pays_nssf: boolean;
  pays_shif: boolean;
  pays_housing_levy: boolean;
  pays_helb: boolean;
  krapin: string;
  nssf_number: string;
  shif_number: string;

  // Payment
  payment_method: string;
  bank_name: string;
  bank_code: string;
  branch_name: string;
  branch_code: string;
  account_number: string;
  account_name: string;
  mobile_type: string;
  phone_number: string;

  // Contract
  contract_type: string;
  start_date: string;
  end_date: string;
  probation_end_date: string;
  contract_status: string;
}

// Optional: Create a type for the payload to send to backend
interface EmployeeCreatePayload {
  // Employee fields
  employee_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  marital_status: string;
  citizenship: string;
  id_type: string;
  id_number: string;
  has_disability: boolean;
  department_id: string;
  sub_department_id: string;
  job_title_id: string;
  hire_date: string;
  job_type: string;
  employee_status: string;
  employee_status_effective_date: string;
  employee_type: string;
  salary: number;
  pays_paye: boolean;
  pays_nssf: boolean;
  pays_shif: boolean;
  pays_housing_levy: boolean;
  pays_helb: boolean;
  krapin: string;
  nssf_number: string;
  shif_number: string;

  // Nested objects for backend
  bank_details: {
    payment_method: string;
    bank_name: string;
    bank_code: string;
    branch_name: string;
    branch_code: string;
    account_number: string;
    account_name: string;
    mobile_type: string;
    phone_number: string;
  };
  contract_details: {
    contract_type: string;
    start_date: string;
    end_date: string | null;
    probation_end_date: string | null;
    contract_status: string;
  };
}

const AddEmployeeOnboarding = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const session = useAuthStore.getState().session;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data for selects
  const [departments, setDepartments] = useState<DropdownItem[]>([]);
  const [subDepartments, setSubDepartments] = useState<DropdownItem[]>([]);
  const [jobTitles, setJobTitles] = useState<DropdownItem[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [availableBranches, setAvailableBranches] = useState<BankBranch[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Form State ---
  const [formData, setFormData] = useState<EmployeeFormData>({
    // Step 1: Employee Basic
    employee_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    marital_status: "",
    citizenship: "Kenyan",
    id_type: "National ID",
    id_number: "",
    has_disability: false,

    // Step 2: Employment
    department_id: "",
    sub_department_id: "",
    job_title_id: "",
    hire_date: new Date().toISOString().split("T")[0],
    job_type: "Full-time",
    employee_status: "ACTIVE",
    employee_status_effective_date: new Date().toISOString().split("T")[0],
    employee_type: "Primary Employee",
    salary: 0,

    // Statutory
    pays_paye: true,
    pays_nssf: true,
    pays_shif: true,
    pays_housing_levy: true,
    pays_helb: false,
    krapin: "",
    nssf_number: "",
    shif_number: "",

    // Step 3: Payment
    payment_method: "CASH",
    bank_name: "",
    bank_code: "",
    branch_name: "",
    branch_code: "",
    account_number: "",
    account_name: "",
    mobile_type: "",
    phone_number: "",

    // Contract
    contract_type: "Permanent and Pensionable",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    probation_end_date: "",
    contract_status: "ACTIVE",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${session?.access_token}` };
        const [deptRes, jobRes, bankRes] = await Promise.all([
          fetch(`${API_BASE_URL}/company/${companyId}/departments`, {
            headers,
          }),
          fetch(`${API_BASE_URL}/company/${companyId}/job-titles`, {
            headers,
          }),
          fetch(`${API_BASE_URL}/banks`),
        ]);

        if (deptRes.ok) setDepartments(await deptRes.json());
        if (jobRes.ok) setJobTitles(await jobRes.json());
        if (bankRes.ok) setBanks(await bankRes.json());
      } catch (error) {
        console.error("Error fetching dependencies", error);
      }
    };
    if (companyId) fetchData();
  }, [companyId, session]);

  // Fetch sub-departments when department changes
  useEffect(() => {
    if (formData.department_id) {
      fetch(
        `${API_BASE_URL}/company/departments/${formData.department_id}/sub-departments`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      )
        .then((res) => res.json())
        .then((data) => setSubDepartments(data));
    }
  }, [formData.department_id, session]);

  const steps = [
    {
      title: "Personal Info",
      icon: <User size={18} />,
      desc: "Basic identity details",
    },
    {
      title: "Employment",
      icon: <Briefcase size={18} />,
      desc: "Role and compensation",
    },
    {
      title: "Statutory",
      icon: <ShieldCheck size={18} />,
      desc: "Tax and contributions",
    },
    {
      title: "Payment",
      icon: <Banknote size={18} />,
      desc: "Bank or Mobile details",
    },
  ];

  const handleChange = (
    field: keyof EmployeeFormData,
    value: string | boolean | number,
  ) => {
    setFormData((prev: EmployeeFormData) => {
      const updated = { ...prev, [field]: value };

      // Logic for Bank/Branch selection
      if (field === "bank_name") {
        const selectedBank = banks.find((b) => b.name === value);
        updated.bank_code = selectedBank?.bank_code || "";
        updated.branch_name = ""; // Reset branch on bank change
        updated.branch_code = "";
        setAvailableBranches(selectedBank?.branches || []);
      }
      if (field === "branch_name" && typeof value === "string") {
        const selectedBranch = availableBranches.find((b) => b.name === value);
        updated.branch_code = selectedBranch?.branch_code || "";
      }

      return updated;
    });
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 0) {
      if (!formData.first_name) newErrors.first_name = "Required";
      if (!formData.last_name) newErrors.last_name = "Required";
      if (!formData.employee_number)
        newErrors.employee_number = "ID is required";
    }
    if (currentStep === 1) {
      if (!formData.salary) newErrors.salary = "Salary is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
      else handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const {
        bank_name,
        bank_code,
        branch_name,
        branch_code,
        account_number,
        account_name,
        mobile_type,
        phone_number,
        payment_method, // payment fields
        contract_type,
        start_date,
        end_date,
        probation_end_date,
        contract_status, // contract fields
        ...baseEmployeeData
      } = formData;

      const payload: EmployeeCreatePayload = {
        ...baseEmployeeData,
        bank_details: {
          payment_method,
          bank_name,
          bank_code,
          branch_name,
          branch_code,
          account_number,
          account_name,
          mobile_type,
          phone_number,
        },
        contract_details: {
          contract_type,
          start_date,
          end_date: end_date || null,
          probation_end_date: probation_end_date || null,
          contract_status,
        },
      };
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create employee");
      }

      toast.success("Employee created successfully");
      navigate(`/company/${companyId}/employees`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex md:flex-row bg-slate-50/30 min-h-full">
      {/* --- Sidebar Stepper --- */}
      <div
        className="w-full md:w-80 bg-white border-r border-slate-200 p-8 flex flex-col
                md:sticky md:top-0 md:h-[calc(100vh-64px)]"
      >
        <div className="mb-10 flex items-center gap-2 text-slate-900">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-bold text-xl tracking-tight">Add Employee</h2>
        </div>

        <div className="space-y-8 relative">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 relative">
              {i !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-4.75 top-10 w-0.5 h-[calc(100%-12px)]",
                    currentStep > i ? "bg-emerald-500" : "bg-slate-100",
                  )}
                />
              )}
              <div
                className={cn(
                  "z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  currentStep === i
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : currentStep > i
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-200 bg-white text-slate-400",
                )}
              >
                {currentStep > i ? <CheckCircle2 size={18} /> : s.icon}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-sm font-bold",
                    currentStep === i ? "text-blue-600" : "text-slate-500",
                  )}
                >
                  {s.title}
                </span>
                <span className="text-[11px] text-slate-400">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Form Area --- */}
      <div className="flex-1 overflow-y-auto p-8 md:p-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-none p-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900">
                {steps[currentStep].title}
              </h3>
              <p className="text-slate-500 text-sm">
                Please provide the {steps[currentStep].title.toLowerCase()} for
                the new record.
              </p>
            </header>

            <div className="">
              {/* STEP 1: PERSONAL INFO */}
              {currentStep === 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SectionHeader title="Identity & Contact" />
                  <div className="grid grid-cols-2 gap-6">
                    <FloatingField
                      label="Employee Number"
                      required
                      value={formData.employee_number}
                      error={errors.employee_number}
                      onChange={(e) =>
                        handleChange("employee_number", e.target.value)
                      }
                    />
                    <FloatingField
                      label="First Name"
                      required
                      value={formData.first_name}
                      error={errors.first_name}
                      onChange={(e) =>
                        handleChange("first_name", e.target.value)
                      }
                    />
                    <FloatingField
                      label="Middle Name"
                      required
                      value={formData.middle_name}
                      error={errors.middle_name}
                      onChange={(e) =>
                        handleChange("middle_name", e.target.value)
                      }
                    />
                    <FloatingField
                      label="Last Name"
                      required
                      value={formData.last_name}
                      error={errors.last_name}
                      onChange={(e) =>
                        handleChange("last_name", e.target.value)
                      }
                    />
                    <FloatingField
                      label="Email Address"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                    <FloatingField
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </div>
                  <SectionHeader title="Bio Data" />
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <Label className="text-[11px] text-slate-400 uppercase font-bold">
                        Gender
                      </Label>
                      <div className="flex gap-4 mt-2">
                        {["Male", "Female", "Other"].map((g) => (
                          <Button
                            key={g}
                            variant="outline"
                            size="sm"
                            className={cn(
                              "shadow-none rounded-md",
                              formData.gender === g
                                ? "border-blue-600 bg-blue-50 text-blue-600"
                                : "",
                            )}
                            onClick={() => handleChange("gender", g)}
                          >
                            {g}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <FloatingSearchableSelect
                      label="Marital Status"
                      options={["Single", "Married", "Divorced", "Widowed"]}
                      value={formData.marital_status}
                      onChange={(v) => handleChange("marital_status", v)}
                    />
                    <FloatingField
                      label="Date of Birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        handleChange("date_of_birth", e.target.value)
                      }
                    />
                    <FloatingSearchableSelect
                      label="Blood Group"
                      options={[
                        "A+",
                        "A-",
                        "B+",
                        "B-",
                        "O+",
                        "O-",
                        "AB+",
                        "AB-",
                      ]}
                      value={formData.blood_group}
                      onChange={(v) => handleChange("blood_group", v)}
                    />
                    <FloatingSearchableSelect
                      label="Citizenship"
                      options={["Kenyan", "Non-Kenyan"]}
                      value={formData.citizenship}
                      onChange={(v) => handleChange("citizenship", v)}
                    />
                    <ToggleRow
                      label="Has disability"
                      checked={formData.has_disability}
                      onChange={(checked) =>
                        handleChange("has_disability", checked)
                      }
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SectionHeader title="Organization" />
                  <div className="grid grid-cols-2 gap-6">
                    <FloatingSearchableSelect
                      label="Department"
                      options={departments}
                      value={formData.department_id}
                      onChange={(v) => handleChange("department_id", v)}
                    />
                    <FloatingSearchableSelect
                      label="Sub Department"
                      options={subDepartments}
                      value={formData.sub_department_id}
                      onChange={(v) => handleChange("sub_department_id", v)}
                    />
                    <FloatingSearchableSelect
                      label="Job Title"
                      options={jobTitles}
                      value={formData.job_title_id}
                      onChange={(v) => handleChange("job_title_id", v)}
                    />
                    <FloatingSearchableSelect
                      label="Job Type"
                      options={[
                        "Full-time",
                        "Part-time",
                        "Contract",
                        "Internship",
                      ]}
                      value={formData.job_type}
                      onChange={(v) => handleChange("job_type", v)}
                    />
                  </div>
                  <SectionHeader title="Contract Details" />
                  <div className="grid grid-cols-2 gap-6">
                    <FloatingSearchableSelect
                      label="Contract Type"
                      options={[
                        "Permanent and Pensionable",
                        "Fixed-Term",
                        "Casual",
                        "Probation",
                      ]}
                      value={formData.contract_type}
                      onChange={(v) => handleChange("contract_type", v)}
                    />
                    <FloatingField
                      label="Basic Salary"
                      required
                      type="number"
                      value={formData.salary}
                      error={errors.salary}
                      onChange={(e) => handleChange("salary", e.target.value)}
                    />
                    <FloatingField
                      label="Hire Date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) =>
                        handleChange("hire_date", e.target.value)
                      }
                    />
                    <FloatingField
                      label="Contract Start Date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        handleChange("start_date", e.target.value)
                      }
                    />
                    <FloatingField
                      label="Contract End Date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleChange("end_date", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SectionHeader title="Tax & Identification" />
                  <div className="grid grid-cols-2 gap-6">
                    <FloatingField
                      label="KRA PIN"
                      value={formData.krapin}
                      onChange={(e) => handleChange("krapin", e.target.value)}
                    />
                    <FloatingSearchableSelect
                      label="ID Type"
                      options={["National ID", "Passport"]}
                      value={formData.id_type}
                      onChange={(v) => handleChange("id_type", v)}
                    />
                    <FloatingField
                      label="National ID / Passport"
                      value={formData.id_number}
                      onChange={(e) =>
                        handleChange("id_number", e.target.value)
                      }
                    />
                    <FloatingField
                      label="NSSF Number"
                      value={formData.nssf_number}
                      onChange={(e) =>
                        handleChange("nssf_number", e.target.value)
                      }
                    />
                    <FloatingField
                      label="SHIF Number"
                      value={formData.shif_number}
                      onChange={(e) =>
                        handleChange("shif_number", e.target.value)
                      }
                    />
                  </div>
                  <SectionHeader title="Payroll Inclusions" />
                  <div className="col-span-2 grid grid-cols-2 gap-4 mt-4">
                    {[
                      "pays_paye",
                      "pays_nssf",
                      "pays_shif",
                      "pays_housing_levy",
                    ].map((stat) => {
                      // Type-safe way to access the property
                      const checked = formData[stat as keyof EmployeeFormData];

                      return (
                        <ToggleRow
                          key={stat}
                          label={stat.replace("pays_", "").replace("_", " ")}
                          checked={
                            typeof checked === "boolean" ? checked : false
                          }
                          onChange={(checked) =>
                            handleChange(
                              stat as keyof EmployeeFormData,
                              checked,
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SectionHeader title="Payment Settings" />
                  <div className="grid grid-cols-2 gap-6">
                    <FloatingSearchableSelect
                      label="Payment Method"
                      options={["BANK", "MOBILE", "CASH"]}
                      value={formData.payment_method}
                      onChange={(v) => handleChange("payment_method", v)}
                    />
                  </div>
                  {formData.payment_method === "BANK" && (
                    <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in-95">
                      <FloatingSearchableSelect
                        label="Select Bank"
                        options={banks.map((b) => b.name)}
                        value={formData.bank_name}
                        onChange={(v) => handleChange("bank_name", v)}
                      />
                      <FloatingSearchableSelect
                        label="Select Branch"
                        options={availableBranches.map((br) => br.name)}
                        value={formData.branch_name}
                        onChange={(v) => handleChange("branch_name", v)}
                      />
                      <FloatingField
                        label="Account Name"
                        value={formData.account_name}
                        onChange={(e) =>
                          handleChange("account_name", e.target.value)
                        }
                      />
                      <FloatingField
                        label="Account Number"
                        value={formData.account_number}
                        onChange={(e) =>
                          handleChange("account_number", e.target.value)
                        }
                      />
                    </div>
                  )}
                  {formData.payment_method === "MOBILE" && (
                    <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in-95">
                      <FloatingSearchableSelect
                        label="Provider"
                        options={["M-Pesa", "Airtel Money", "T-Kash"]}
                        value={formData.mobile_type}
                        onChange={(v) => handleChange("mobile_type", v)}
                      />
                      <FloatingField
                        label="Mobile Phone Number"
                        value={formData.phone_number}
                        onChange={(e) =>
                          handleChange("phone_number", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-between items-center border-t border-slate-100 pt-8">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={currentStep === 0 || isSubmitting}
                className="text-slate-400 hover:text-slate-600 cursor-pointer border"
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-none rounded-md cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : currentStep === steps.length - 1 ? (
                  "Complete Setup"
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeOnboarding;
