// src/components/company/payroll/statutory/EditAllowanceDialog.tsx
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
import { Switch } from "@/components/ui/switch"; // Import Switch
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { AllowanceType } from "./AllowanceManageTable";

type Props = {
  allowance: AllowanceType;
  companyId: string;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditAllowanceDialog({ allowance, companyId, onClose, onUpdated }: Props) {
  const { session } = useAuthStore();
  const [name, setName] = useState(allowance.name);
  const [description, setDescription] = useState(allowance.description);
  const [isCash, setIsCash] = useState(allowance.is_cash);
  const [isTaxable, setIsTaxable] = useState(allowance.is_taxable);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/company/${companyId}/allowance-types/${allowance.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name,
          description,
          is_cash: isCash,
          is_taxable: isTaxable,
        }),
      });
      onUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update allowance type", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Allowance Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="isCash">Is Cash?</Label>
            <Switch
              id="isCash"
              checked={isCash}
              onCheckedChange={setIsCash}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="isTaxable">Is Taxable?</Label>
            <Switch
              id="isTaxable"
              checked={isTaxable}
              onCheckedChange={setIsTaxable}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}