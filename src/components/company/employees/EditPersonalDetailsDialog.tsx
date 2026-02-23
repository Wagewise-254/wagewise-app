// components/company/employees/EditPersonalDetailsDialog.tsx
import { useState } from "react";
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


export default function EditPersonalDetailsDialog({ employee, isOpen, onClose, onRefresh }: EditDialogProps) {
  const [loading, setLoading] = useState(false);
  const session = useAuthStore.getState().session;
  
  const [formData, setFormData] = useState({
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
    id_type: employee.id_type || "National ID",
    id_number: employee.id_number || "",
    has_disability: employee.has_disability || false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Edit Personal Details
          </DialogTitle>
          <p className="text-slate-500 text-sm">
            Update the personal information for {employee.first_name} {employee.last_name}
          </p>
        </DialogHeader>
        
        <div className="py-6 space-y-8">
          {/* Identity & Contact Section */}
          <section>
            <SectionHeader title="Identity & Contact" />
            <div className="grid grid-cols-2 gap-6 mt-4">
              <FloatingField
                label="Employee Number"
                required
                value={formData.employee_number}
                onChange={(e) => handleChange("employee_number", e.target.value)}
              />
              <FloatingField
                label="First Name"
                required
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
              />
              <FloatingField
                label="Middle Name"
                value={formData.middle_name}
                onChange={(e) => handleChange("middle_name", e.target.value)}
              />
              <FloatingField
                label="Last Name"
                required
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
              />
              <FloatingField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              <FloatingField
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </section>

          {/* Bio Data Section */}
          <section>
            <SectionHeader title="Bio Data" />
            <div className="grid grid-cols-3 gap-6 mt-4">
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
                          : ""
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
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
              />

              <FloatingSearchableSelect
                label="Blood Group"
                options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                value={formData.blood_group}
                onChange={(v) => handleChange("blood_group", v)}
              />

              <FloatingSearchableSelect
                label="Citizenship"
                options={["Kenyan", "Non-Kenyan"]}
                value={formData.citizenship}
                onChange={(v) => handleChange("citizenship", v)}
              />

              <FloatingSearchableSelect
                label="ID Type"
                options={["National ID", "Passport"]}
                value={formData.id_type}
                onChange={(v) => handleChange("id_type", v)}
              />

              <FloatingField
                label="ID Number"
                value={formData.id_number}
                onChange={(e) => handleChange("id_number", e.target.value)}
              />

              <div className="col-span-1">
                <ToggleRow
                  label="Has disability"
                  checked={formData.has_disability}
                  onChange={(checked) => handleChange("has_disability", checked)}
                />
              </div>
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