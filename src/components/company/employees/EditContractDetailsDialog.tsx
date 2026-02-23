// components/company/employees/EditContractDetailsDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingField, FloatingSearchableSelect, SectionHeader } from "@/components/company/employees/employeeutils";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { EditDialogProps } from "@/types/employees";

interface DropdownItem {
  id: string;
  name?: string;
  title?: string;
}

export default function EditContractDetailsDialog({ employee, isOpen, onClose, onRefresh }: EditDialogProps) {
  const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<DropdownItem[]>([]);
    const [subDepartments, setSubDepartments] = useState<DropdownItem[]>([]);
    const [jobTitles, setJobTitles] = useState<DropdownItem[]>([]);
  const session = useAuthStore.getState().session;
  
  const activeContract = employee.employee_contracts?.find(c => c.contract_status === 'ACTIVE') || employee.employee_contracts?.[0];
  
  const [formData, setFormData] = useState({
    // Employment Details
    department_id: employee.department_id || "",
    sub_department_id: employee.sub_department_id || "",
    job_title_id: employee.job_title_id || "",
    job_type: employee.job_type || "Full-time",
    hire_date: employee.hire_date || new Date().toISOString().split("T")[0],
    salary: employee.salary || 0,
    employee_type: employee.employee_type || "Primary Employee",
    employee_status: employee.employee_status || "ACTIVE",
    
    // Contract Details
    contract_type: activeContract?.contract_type || "Permanent and Pensionable",
    start_date: activeContract?.start_date || new Date().toISOString().split("T")[0],
    end_date: activeContract?.end_date || "",
    probation_end_date: activeContract?.probation_end_date || "",
    contract_status: activeContract?.contract_status || "ACTIVE",
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

    useEffect(() => {
      const fetchData = async () => {
        try {
          const headers = { Authorization: `Bearer ${session?.access_token}` };
          const [deptRes, jobRes] = await Promise.all([
            fetch(`${API_BASE_URL}/company/${employee.company_id}/departments`, {
              headers,
            }),
            fetch(`${API_BASE_URL}/company/${employee.company_id}/job-titles`, {
              headers,
            }),
          ]);
  
          if (deptRes.ok) setDepartments(await deptRes.json());
          if (jobRes.ok) setJobTitles(await jobRes.json());
        } catch (error) {
          console.error("Error fetching dependencies", error);
        }
      };
      if (employee.company_id) fetchData();
    }, [employee.company_id, session]);

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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Update main employee fields
      const response = await fetch(
        `${API_BASE_URL}/company/${employee.company_id}/employees/${employee.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            department_id: formData.department_id,
            sub_department_id: formData.sub_department_id,
            job_title_id: formData.job_title_id,
            job_type: formData.job_type,
            hire_date: formData.hire_date,
            salary: formData.salary,
            employee_type: formData.employee_type,
            employee_status: formData.employee_status,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      // Update contract if exists
      if (activeContract) {
        const contractResponse = await fetch(
          `${API_BASE_URL}/company/${employee.company_id}/employees/${employee.id}/contracts/${activeContract.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              contract_type: formData.contract_type,
              start_date: formData.start_date,
              end_date: formData.end_date || null,
              probation_end_date: formData.probation_end_date || null,
              contract_status: formData.contract_status,
            }),
          }
        );

        if (!contractResponse.ok) {
          throw new Error("Failed to update contract");
        }
      }

      toast.success("Contract details updated successfully");
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Edit Contract Details
          </DialogTitle>
          <p className="text-slate-500 text-sm">
            Update employment and contract information
          </p>
        </DialogHeader>
        
        <div className="py-6 space-y-8">
          {/* Organization Section */}
          <section>
            <SectionHeader title="Organization" />
            <div className="grid grid-cols-2 gap-6 mt-4">
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
                options={["Full-time", "Part-time", "Contract", "Internship"]}
                value={formData.job_type}
                onChange={(v) => handleChange("job_type", v)}
              />
              <FloatingSearchableSelect
                label="Employee Type"
                options={["Primary Employee", "Secondary Employee", "Intern", "Contractor"]}
                value={formData.employee_type}
                onChange={(v) => handleChange("employee_type", v)}
              />
              <FloatingSearchableSelect
                label="Employee Status"
                options={["ACTIVE", "On Leave", "Terminated", "Suspended"]}
                value={formData.employee_status}
                onChange={(v) => handleChange("employee_status", v)}
              />
            </div>
          </section>

          {/* Contract Details Section */}
          <section>
            <SectionHeader title="Contract Details" />
            <div className="grid grid-cols-2 gap-6 mt-4">
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
                onChange={(e) => handleChange("salary", parseFloat(e.target.value))}
              />
              <FloatingField
                label="Hire Date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleChange("hire_date", e.target.value)}
              />
              <FloatingField
                label="Contract Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
              />
              <FloatingField
                label="Contract End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
              />
              <FloatingField
                label="Probation End Date"
                type="date"
                value={formData.probation_end_date}
                onChange={(e) => handleChange("probation_end_date", e.target.value)}
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
      </DialogContent>
    </Dialog>
  );
}