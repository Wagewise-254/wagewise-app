// src/components/company/payroll/deductions/EditDeductionDialog.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { DeductionType } from "./DeductionManageTable";
import { toast } from "sonner";

type Props = {
  deduction: DeductionType;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditDeductionDialog({
  deduction,
  companyId,
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const { session } = useAuthStore();
  const [name, setName] = useState(deduction.name);
  const [description, setDescription] = useState(deduction.description);
  const [isTaxDeductible, setIsTaxDeductible] = useState(
    deduction.is_tax_deductible
  );
  const [loading, setLoading] = useState(false);
  const [hasMaximumValue, setHasMaximumValue] = useState(
    deduction.has_maximum_value
  );
  const [maximumValue, setMaximumValue] = useState<string>(
    deduction.maximum_value !== null ? deduction.maximum_value.toString() : ""
  );

  const handleUpdate = async () => {
    if (!name) {
      toast.error("Name is required.");
      return;
    }

    // validation for maximum value
    if (hasMaximumValue && (!maximumValue || isNaN(Number(maximumValue)))) {
      toast.error("Maximum value must be a valid number.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/deduction-types/${deduction.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            name,
            description,
            is_tax_deductible: isTaxDeductible,
            has_maximum_value: hasMaximumValue,
            maximum_value: hasMaximumValue ? parseFloat(maximumValue) : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update deduction type");
      }

      toast.success("Deduction type updated successfully.");

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update deduction type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Deduction Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="isTaxDeductible">Is Tax Deductible?</Label>
            <Switch
              id="isTaxDeductible"
              checked={isTaxDeductible}
              onCheckedChange={setIsTaxDeductible}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="hasMaximumValue">Has Maximum Value?</Label>
            <Switch
              id="hasMaximumValue"
              checked={hasMaximumValue}
              onCheckedChange={setHasMaximumValue}
            />
          </div>
          {hasMaximumValue && (
            <div>
              <Label htmlFor="maximumValue">Maximum Value</Label>
              <Input
                id="maximumValue"
                type="number"
                value={maximumValue}
                onChange={(e) => setMaximumValue(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
