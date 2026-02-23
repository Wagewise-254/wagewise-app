// components/company/employees/EditPaymentDetailsDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingField, FloatingSearchableSelect, SectionHeader } from "@/components/company/employees/employeeutils";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { EditDialogProps, EmployeePaymentDetails} from "@/types/employees";

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

export default function EditPaymentDetailsDialog({ employee, isOpen, onClose, onRefresh }: EditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [availableBranches, setAvailableBranches] = useState<BankBranch[]>([]);
  const session = useAuthStore.getState().session;
  
  const paymentDetails = employee.employee_payment_details as EmployeePaymentDetails || undefined;
  
  const [formData, setFormData] = useState({
    payment_method: paymentDetails.payment_method || "CASH",
    bank_name: paymentDetails.bank_name || "",
    bank_code: paymentDetails.bank_code || "",
    branch_name: paymentDetails.branch_name || "",
    branch_code: paymentDetails.branch_code || "",
    account_number: paymentDetails.account_number || "",
    account_name: paymentDetails.account_name || "",
    mobile_type: paymentDetails.mobile_type || "",
    phone_number: paymentDetails.phone_number || "",
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (formData.bank_name && banks.length > 0) {
      const selectedBank = banks.find(b => b.name === formData.bank_name);
      setAvailableBranches(selectedBank?.branches || []);
    }
  }, [formData.bank_name, banks]);

  const fetchBanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/banks`);
      const data = await res.json();
      setBanks(data);
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Handle bank selection
      if (field === "bank_name") {
        const selectedBank = banks.find(b => b.name === value);
        updated.bank_code = selectedBank?.bank_code || "";
        updated.branch_name = "";
        updated.branch_code = "";
      }

      // Handle branch selection
      if (field === "branch_name") {
        const selectedBranch = availableBranches.find(b => b.name === value);
        updated.branch_code = selectedBranch?.branch_code || "";
      }

      return updated;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Check if payment details exist
      const paymentId = paymentDetails?.id;
      const method = paymentId ? "PUT" : "POST";
      const url = paymentId 
        ? `${API_BASE_URL}/company/${employee.company_id}/employees/${employee.id}/payment-details/${paymentId}`
        : `${API_BASE_URL}/company/${employee.company_id}/employees/${employee.id}/payment-details`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update payment details");
      }

      toast.success("Payment details updated successfully");
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Edit Payment Details
          </DialogTitle>
          <p className="text-slate-500 text-sm">
            Update bank or mobile payment information
          </p>
        </DialogHeader>
        
        <div className="py-6 space-y-8">
          <section>
            <SectionHeader title="Payment Settings" />
            <div className="grid grid-cols-2 gap-6 mt-4">
              <FloatingSearchableSelect
                label="Payment Method"
                options={["BANK", "MOBILE", "CASH"]}
                value={formData.payment_method}
                onChange={(v) => handleChange("payment_method", v)}
              />
            </div>

            {/* Bank Payment Form */}
            {formData.payment_method === "BANK" && (
              <div className="grid grid-cols-2 gap-6 mt-6 animate-in fade-in zoom-in-95">
                <FloatingSearchableSelect
                  label="Select Bank"
                  options={banks.map(b => b.name)}
                  value={formData.bank_name}
                  onChange={(v) => handleChange("bank_name", v)}
                />
                <FloatingSearchableSelect
                  label="Select Branch"
                  options={availableBranches.map(br => br.name)}
                  value={formData.branch_name}
                  onChange={(v) => handleChange("branch_name", v)}
                />
                <FloatingField
                  label="Account Name"
                  value={formData.account_name}
                  onChange={(e) => handleChange("account_name", e.target.value)}
                />
                <FloatingField
                  label="Account Number"
                  value={formData.account_number}
                  onChange={(e) => handleChange("account_number", e.target.value)}
                />
              </div>
            )}

            {/* Mobile Payment Form */}
            {formData.payment_method === "MOBILE" && (
              <div className="grid grid-cols-2 gap-6 mt-6 animate-in fade-in zoom-in-95">
                <FloatingSearchableSelect
                  label="Provider"
                  options={["M-Pesa", "Airtel Money", "T-Kash"]}
                  value={formData.mobile_type}
                  onChange={(v) => handleChange("mobile_type", v)}
                />
                <FloatingField
                  label="Mobile Phone Number"
                  value={formData.phone_number}
                  onChange={(e) => handleChange("phone_number", e.target.value)}
                />
              </div>
            )}

            {/* Cash Payment - Just a note */}
            {formData.payment_method === "CASH" && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">
                  Payment will be made in cash. No additional details required.
                </p>
              </div>
            )}
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