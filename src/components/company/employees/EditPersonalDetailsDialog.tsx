// components/company/employees/EditPersonalDetailsDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FloatingField, FloatingSearchableSelect, SectionHeader, ToggleRow } from "@/components/company/employees/employeeutils";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { EditDialogProps } from "@/types/employees";

interface DropdownItem {
  id: string;
  name?: string;
  title?: string;
}

export default function EditPersonalDetailsDialog({ employee, isOpen, onClose, onRefresh }: EditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DropdownItem[]>([]);
  const [subDepartments, setSubDepartments] = useState<DropdownItem[]>([]);
  const [jobTitles, setJobTitles] = useState<DropdownItem[]>([]);
  const session = useAuthStore.getState().session;
  
  const [formData, setFormData] = useState({
    // Identity
    employee_number: employee.employee_number,
    first_name: employee.first_name,
    middle_name: employee.middle_name || "",
    last_name: employee.last_name,
    email: employee.email || "",
    phone: employee.phone || "",
    date_of_birth: employee.date_of_birth || "",
    gender: employee.gender || "",
    blood_group: employee.blood_group || "",
    marital_status: employee.marital_status || "",
    citizenship: employee.citizenship || "Kenyan",
    
    // Statutory IDs
    id_type: employee.id_type || "National ID",
    id_number: employee.id_number || "",
    krapin: employee.krapin || "",
    nssf_number: employee.nssf_number || "",
    shif_number: employee.shif_number || "",
    
    // Employment Organization
    department_id: employee.department_id || "",
    sub_department_id: employee.sub_department_id || "",
    job_title_id: employee.job_title_id || "",
    job_type: employee.job_type || "Full-time",
    employee_type: employee.employee_type || "Primary Employee",
    reports_to: employee.reports_to || "",
    
    // Employment Timeline
    hire_date: employee.hire_date || new Date().toISOString().split("T")[0],
    
    // Statutory Deductions Setup
    pays_paye: employee.pays_paye,
    pays_nssf: employee.pays_nssf,
    pays_shif: employee.pays_shif,
    pays_housing_levy: employee.pays_housing_levy,
    pays_helb: employee.pays_helb,
    
    // Disability
    has_disability: employee.has_disability || false,
  });

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${session?.access_token}` };
        const [deptRes, jobRes] = await Promise.all([
          fetch(`${API_BASE_URL}/company/${employee.company_id}/departments`, { headers }),
          fetch(`${API_BASE_URL}/company/${employee.company_id}/job-titles`, { headers }),
        ]);

        if (deptRes.ok) setDepartments(await deptRes.json());
        if (jobRes.ok) setJobTitles(await jobRes.json());
      } catch (error) {
        console.error("Error fetching dependencies", error);
      }
    };
    if (employee.company_id && isOpen) fetchData();
  }, [employee.company_id, session, isOpen]);

  // Fetch sub-departments when department changes
  useEffect(() => {
    if (formData.department_id && isOpen) {
      fetch(
        `${API_BASE_URL}/company/departments/${formData.department_id}/sub-departments`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
        .then((res) => res.json())
        .then((data) => setSubDepartments(data))
        .catch(console.error);
    }
  }, [formData.department_id, session, isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${employee.company_id}/employees/${employee.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      toast.success("Personal details updated successfully");
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Edit Personal Details
            </DialogTitle>
            <p className="text-slate-500 text-sm">
              Update personal, employment, and statutory information for {employee.first_name} {employee.last_name}
            </p>
          </DialogHeader>
          
          <div className="py-6 space-y-8">
            {/* Identity & Contact Section - 3 columns */}
            <section>
              <SectionHeader title="Identity & Contact" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <div className="w-full">
                  <FloatingField
                    label="Employee Number"
                    required
                    value={formData.employee_number}
                    onChange={(e) => handleChange("employee_number", e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                    label="First Name"
                    required
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                    label="Middle Name"
                    value={formData.middle_name}
                    onChange={(e) => handleChange("middle_name", e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                    label="Last Name"
                    required
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Bio Data Section */}
            <section>
              <SectionHeader title="Bio Data" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <div>
                  <Label className="text-[11px] text-slate-400 uppercase font-bold">Gender</Label>
                  <div className="flex gap-3 mt-2">
                    {["Male", "Female", "Other"].map((g) => (
                      <Button
                        key={g}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 shadow-none rounded-md",
                          formData.gender === g ? "border-blue-600 bg-blue-50 text-blue-600" : ""
                        )}
                        onClick={() => handleChange("gender", g)}
                      >
                        {g}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="w-full">
                  <FloatingSearchableSelect
                    label="Marital Status"
                    options={["Single (never married)", "Married", "Divorced", "Widowed", "Separated"]}
                    value={formData.marital_status}
                    onChange={(v) => handleChange("marital_status", v)}
                  />
                </div>

                <div className="w-full">
                  <FloatingField
                    label="Date of Birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange("date_of_birth", e.target.value)}
                  />
                </div>

                <div className="w-full">
                  <FloatingSearchableSelect
                    label="Blood Group"
                    options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                    value={formData.blood_group}
                    onChange={(v) => handleChange("blood_group", v)}
                  />
                </div>

                <div className="w-full">
                  <FloatingSearchableSelect
                    label="Citizenship"
                    options={["Kenyan", "Non-Kenyan"]}
                    value={formData.citizenship}
                    onChange={(v) => handleChange("citizenship", v)}
                  />
                </div>
              </div>
            </section>

            {/* Statutory IDs Section */}
            <section>
              <SectionHeader title="Statutory Identifiers" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <div className="w-full">
                  <FloatingSearchableSelect
                    label="ID Type"
                    options={["National ID", "Passport"]}
                    value={formData.id_type}
                    onChange={(v) => handleChange("id_type", v)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                    label="ID Number"
                    value={formData.id_number}
                    onChange={(e) => handleChange("id_number", e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                    label="KRA PIN"
                    value={formData.krapin}
                    onChange={(e) => handleChange("krapin", e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                    label="NSSF Number"
                    value={formData.nssf_number}
                    onChange={(e) => handleChange("nssf_number", e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                    label="SHIF Number"
                    value={formData.shif_number}
                    onChange={(e) => handleChange("shif_number", e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Employment Organization Section */}
            <section>
              <SectionHeader title="Employment Organization" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <div className="w-full">
                  <FloatingSearchableSelect
                    label="Department"
                    options={departments}
                    value={formData.department_id}
                    onChange={(v) => handleChange("department_id", v)}
                  />
                </div>
                <div className="w-full">
                  <FloatingSearchableSelect
                    label="Sub Department"
                    options={subDepartments}
                    value={formData.sub_department_id}
                    onChange={(v) => handleChange("sub_department_id", v)}
                  />
                </div>
                <div className="w-full">
                  <FloatingSearchableSelect
                    label="Job Title"
                    options={jobTitles}
                    value={formData.job_title_id}
                    onChange={(v) => handleChange("job_title_id", v)}
                  />
                </div>
                <div className="w-full">
                  <FloatingSearchableSelect
                    label="Job Type"
                    options={["Full-time", "Part-time", "Contract", "Internship"]}
                    value={formData.job_type}
                    onChange={(v) => handleChange("job_type", v)}
                  />
                </div>
                <div className="w-full">
                  <FloatingSearchableSelect
                    label="Employee Type"
                    options={["Primary Employee", "Secondary Employee", "Consultant"]}
                    value={formData.employee_type}
                    onChange={(v) => handleChange("employee_type", v)}
                  />
                </div>
                <div className="w-full">
                  <FloatingField
                   disabled
                    label="Reports To (Employee ID)"
                    value={formData.reports_to}
                    onChange={(e) => handleChange("reports_to", e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Employment Timeline Section */}
            <section>
              <SectionHeader title="Employment Timeline" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <div className="w-full">
                  <FloatingField
                    label="Hire Date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => handleChange("hire_date", e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Statutory Deductions Setup Section */}
            <section>
              <SectionHeader title="Statutory Deductions Setup" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <ToggleRow
                  label="Pays PAYE"
                  checked={formData.pays_paye}
                  onChange={(checked) => handleChange("pays_paye", checked)}
                />
                <ToggleRow
                  label="Pays NSSF"
                  checked={formData.pays_nssf}
                  onChange={(checked) => handleChange("pays_nssf", checked)}
                />
                <ToggleRow
                  label="Pays SHIF"
                  checked={formData.pays_shif}
                  onChange={(checked) => handleChange("pays_shif", checked)}
                />
                <ToggleRow
                  label="Pays Housing Levy"
                  checked={formData.pays_housing_levy}
                  onChange={(checked) => handleChange("pays_housing_levy", checked)}
                />
                <ToggleRow
                  label="Pays HELB"
                  checked={formData.pays_helb}
                  onChange={(checked) => handleChange("pays_helb", checked)}
                />
              </div>
            </section>

            {/* Disability Status Section */}
            <section>
              <SectionHeader title="Disability Status" />
              <div className="mt-4">
                <ToggleRow
                  label="Has Disability"
                  checked={formData.has_disability}
                  onChange={(checked) => handleChange("has_disability", checked)}
                />
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-6">
          <Button variant="outline" onClick={onClose} className="shadow-none">
            Cancel
          </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-none"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}