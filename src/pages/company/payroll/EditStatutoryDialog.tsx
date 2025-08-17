// src/pages/company/payroll/EditStatutoryDialog.tsx
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/stores/authStore";
import { Employee, UpdateStatutoryPayload } from "@/types/statutory"; // Assuming you have a types file
import { API_BASE_URL } from "@/config";

interface EditStatutoryDialogProps {
  employee: Employee | null;
  companyId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditStatutoryDialog({
  employee,
  companyId,
  onClose,
  onUpdated,
}: EditStatutoryDialogProps) {
  const { session } = useAuthStore();
  const [formState, setFormState] = useState<UpdateStatutoryPayload>({
    pays_paye: false,
    pays_nssf: false,
    pays_housing_levy: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFormState({
        pays_paye: employee.pays_paye,
        pays_nssf: employee.pays_nssf,
        pays_housing_levy: employee.pays_housing_levy,
      });
    }
  }, [employee]);

  const handleSave = async () => {
    if (!employee || !session) {
      setError("Employee data or session is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/${companyId}/employees/${employee.id}/statutories`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(formState),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save changes.");
      }
      
      onUpdated();
      onClose();

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!employee) {
    return null;
  }

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Statutory Deductions for {`${employee.first_name} ${employee.last_name}`}</DialogTitle>
          <DialogDescription>
            Update the statutory deduction status for this employee.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Checkbox
              id="paye"
              checked={formState.pays_paye}
              onCheckedChange={(checked) =>
                setFormState({ ...formState, pays_paye: checked as boolean })
              }
            />
            <Label htmlFor="paye">PAYE</Label>
          </div>
          <div className="flex items-center gap-4">
            <Checkbox
              id="nssf"
              checked={formState.pays_nssf}
              onCheckedChange={(checked) =>
                setFormState({ ...formState, pays_nssf: checked as boolean })
              }
            />
            <Label htmlFor="nssf">NSSF</Label>
          </div>
          <div className="flex items-center gap-4">
            <Checkbox
              id="housing_levy"
              checked={formState.pays_housing_levy}
              onCheckedChange={(checked) =>
                setFormState({
                  ...formState,
                  pays_housing_levy: checked as boolean,
                })
              }
            />
            <Label htmlFor="housing_levy">Housing Levy</Label>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}