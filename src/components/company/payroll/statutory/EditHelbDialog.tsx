import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { EmployeeWithHelb } from "@/components/company/payroll/statutory/HelbStatutorySection";
import { Loader2 } from "lucide-react";

interface EditHelbDialogProps {
  employee: EmployeeWithHelb;
  companyId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditHelbDialog({
  employee,
  companyId,
  onClose,
  onUpdated,
}: EditHelbDialogProps) {
  const { session } = useAuthStore();
  const [helbAccountNumber, setHelbAccountNumber] = useState("");
  const [monthlyDeduction, setMonthlyDeduction] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populate form fields with existing data
  useEffect(() => {
    if (employee?.helb_deductions) {
      setHelbAccountNumber(employee.helb_deductions.helb_account_number || "");
      setMonthlyDeduction(employee.helb_deductions.monthly_deduction?.toString() || "");
      setIsActive(employee.helb_deductions.status === "Active");
    }
  }, [employee]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    if (!monthlyDeduction) {
      setError("Monthly deduction is required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/${companyId}/employees/${employee.id}/helb`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            monthly_deduction: parseFloat(monthlyDeduction),
            is_active: isActive ? "Active" : "Inactive",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update HELB record.");
      }

      onUpdated();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit HELB Deduction</DialogTitle>
          <DialogDescription>
            Editing HELB details for {employee.first_name} {employee.last_name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="helb-account" className="text-right">
              HELB Account No.
            </Label>
            <Input
              id="helb-account"
              value={helbAccountNumber}
              onChange={(e) => setHelbAccountNumber(e.target.value)}
              className="col-span-3"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monthly-deduction" className="text-right">
              Monthly Deduction
            </Label>
            <Input
              id="monthly-deduction"
              type="number"
              value={monthlyDeduction}
              onChange={(e) => setMonthlyDeduction(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="is-active" className="text-right">
              Is Active
            </Label>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              className="col-span-3"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button className="bg-[#7F5EFD] hover:bg-[#6a4acb] text-white" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
