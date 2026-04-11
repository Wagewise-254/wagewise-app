// components/company/employees/EditContractDetailsDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingField, FloatingSearchableSelect, SectionHeader } from "@/components/company/employees/employeeutils";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { EditDialogProps } from "@/types/employees";

export default function EditContractDetailsDialog({ employee, isOpen, onClose, onRefresh }: EditDialogProps) {
  const [loading, setLoading] = useState(false);
  const session = useAuthStore.getState().session;
  
  const activeContract = employee.employee_contracts?.find(c => c.contract_status === 'ACTIVE') || employee.employee_contracts?.[0];
  
  const [formData, setFormData] = useState({
    contract_type: activeContract?.contract_type || "Permanent and Pensionable",
    start_date: activeContract?.start_date || new Date().toISOString().split("T")[0],
    end_date: activeContract?.end_date || "",
    probation_end_date: activeContract?.probation_end_date || "",
    contract_status: activeContract?.contract_status || "ACTIVE",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!activeContract) {
      toast.error("No contract found to update");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${employee.company_id}/employees/${employee.id}/contracts/${activeContract.id}`,
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
        throw new Error(error.error || "Failed to update contract");
      }

      toast.success("Contract updated successfully");
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update contract");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Edit Contract Details
          </DialogTitle>
          <p className="text-slate-500 text-sm">
            Update the employment contract for {employee.first_name} {employee.last_name}
          </p>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <section>
            <SectionHeader title="Contract Information" />
            <div className="grid grid-cols-2 gap-6 mt-4">
              <FloatingSearchableSelect
                label="Contract Type"
                options={[
                  "Permanent and Pensionable",
                  "Fixed-Term Contract",
                  "Casual Employment",
                  "Probationary Contracts",
                  "Contract for Services",
                  "Apprenticeship/Indentured Learnership",
                ]}
                value={formData.contract_type}
                onChange={(v) => handleChange("contract_type", v)}
              />

              <FloatingSearchableSelect
                label="Contract Status"
                options={["ACTIVE", "EXPIRED", "TERMINATED"]}
                value={formData.contract_status}
                onChange={(v) => handleChange("contract_status", v)}
              />

              <FloatingField
                label="Start Date"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
              />

              <FloatingField
                label="End Date"
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