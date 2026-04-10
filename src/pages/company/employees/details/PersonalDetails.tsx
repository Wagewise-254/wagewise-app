// components/company/employees/PersonalDetails.tsx
import { useState } from "react";
import {
  User,
  Contact,
  Fingerprint,
  Calendar,
  Heart,
  Globe,
} from "lucide-react";
import { SectionDetailsHeader } from "@/components/company/employees/employeeutils";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import EditPersonalDetailsDialog from "@/components/company/employees/EditPersonalDetailsDialog";
import { Employee } from "@/types/employees";

interface OutletContext {
  employee: Employee;
  refetch: () => void;
}

export default function PersonalDetails() {
  const { employee, refetch } = useOutletContext<OutletContext>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No employee data available</p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-start">
        <div className="space-y-10 flex-1">
          {/* Section 1: Identity */}
          <section>
            <SectionDetailsHeader title="Identity" icon={User} />
            <div className="grid grid-cols-3 gap-8">
              <DetailItem
                label="Full Name"
                value={`${employee.first_name} ${employee.middle_name || ""} ${employee.last_name}`.trim()}
              />
              <DetailItem label="Gender" value={employee.gender || "—"} />
              <DetailItem
                label="Date of Birth"
                value={formatDate(employee.date_of_birth)}
              />
              <DetailItem
                label="Marital Status"
                value={employee.marital_status || "—"}
              />
              <DetailItem
                label="Citizenship"
                value={employee.citizenship || "—"}
              />
              <DetailItem
                label="Blood Group"
                value={employee.blood_group || "—"}
              />
            </div>
          </section>

          {/* Section 2: Contact */}
          <section>
            <SectionDetailsHeader title="Contact Information" icon={Contact} />
            <div className="grid grid-cols-3 gap-8">
              <DetailItem label="Phone Number" value={employee.phone || "—"} />
              <DetailItem label="Email" value={employee.email || "—"} />
            </div>
          </section>

          {/* Section 3: Statutory IDs */}
          <section>
            <SectionDetailsHeader
              title="Statutory Identifiers"
              icon={Fingerprint}
            />
            <div className="grid grid-cols-3 gap-8">
              <DetailItem
                label="National ID / Passport"
                value={employee.id_number || "—"}
                hint={employee.id_type || ""}
              />
              <DetailItem label="KRA PIN" value={employee.krapin || "—"} />
              <DetailItem
                label="NSSF Number"
                value={employee.nssf_number || "—"}
              />
              <DetailItem
                label="SHIF Number"
                value={employee.shif_number || "—"}
              />
            </div>
          </section>

          {/* Section 4: Employment Details */}
          <section>
            <SectionDetailsHeader title="Employment Details" icon={Calendar} />
            <div className="grid grid-cols-3 gap-8">
              <DetailItem
                label="Hire Date"
                value={formatDate(employee.hire_date)}
              />
              <DetailItem label="Job Type" value={employee.job_type || "—"} />
              <DetailItem
                label="Employee Type"
                value={employee.employee_type || "—"}
              />
            </div>
          </section>

          {/* Section 5: Disability Status */}
          <section>
            <SectionDetailsHeader title="Disability Status" icon={Heart} />
            <div className="grid grid-cols-3 gap-8">
              <DetailItem
                label="Has Disability"
                value={employee.has_disability ? "Yes" : "No"}
              />
            </div>
          </section>

          {/* Section 6: Salary Information */}
          <section>
            <SectionDetailsHeader title="Salary Information" icon={Globe} />
            <div className="grid grid-cols-3 gap-8">
              <DetailItem
                label="Basic Salary"
                value={
                  employee.salary
                    ? `KES ${employee.salary.toLocaleString()}`
                    : "—"
                }
              />
              <DetailItem
                label="Pays PAYE"
                value={employee.pays_paye ? "Yes" : "No"}
              />
              <DetailItem
                label="Pays NSSF"
                value={employee.pays_nssf ? "Yes" : "No"}
              />
              <DetailItem
                label="Pays SHIF"
                value={employee.pays_shif ? "Yes" : "No"}
              />
              <DetailItem
                label="Pays Housing Levy"
                value={employee.pays_housing_levy ? "Yes" : "No"}
              />
            </div>
          </section>
        </div>
        <Button
          onClick={() => setIsEditDialogOpen(true)}
          className="flex bg-transparent items-center cursor-pointer gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-all shadow-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-pencil"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          Edit
        </Button>
      </div>
      <EditPersonalDetailsDialog
        employee={employee}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onRefresh={refetch}
      />
    </div>
  );
}

// Helper component for crisp data display
function DetailItem({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="group p-3 hover:bg-slate-50 rounded-lg transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
          {label}
        </p>
        {hint && (
          <span className="text-[10px] text-slate-300 px-1.5 py-0.5 bg-slate-100 rounded">
            {hint}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}
