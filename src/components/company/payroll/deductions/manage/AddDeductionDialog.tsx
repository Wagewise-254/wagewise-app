// src/components/company/payroll/deductions/AddDeductionDialog.tsx

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
import { toast } from "sonner";

type Props = {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export default function AddDeductionDialog({
  companyId,
  isOpen,
  onClose,
  onUpdated,
}: Props) {
  const { session } = useAuthStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMaximumValue, setHasMaximumValue] = useState(false);
  const [maximumValue, setMaximumValue] = useState<string>("");

  const handleSave = async () => {
    if (!name) {
      toast.error("Name is required.");
      return;
    }

    // check for maximum value if hasMaximumValue is true
    if (hasMaximumValue && (!maximumValue || isNaN(Number(maximumValue)))) {
      toast.error("Maximum value must be a valid number.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/deduction-types`,
        {
          method: "POST",
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
        throw new Error("Failed to create deduction type");
      }

      toast.success("Deduction type created successfully.");

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create deduction type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Deduction Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="my-2" htmlFor="name">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label className="my-2" htmlFor="description">
              Description
            </Label>
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
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
