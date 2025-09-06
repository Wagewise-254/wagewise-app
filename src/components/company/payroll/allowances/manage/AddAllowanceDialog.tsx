// src/components/company/payroll/statutory/AddAllowanceDialog.tsx
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

type Props = {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export default function AddAllowanceDialog({ companyId, isOpen, onClose, onUpdated }: Props) {
  const { session } = useAuthStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCash, setIsCash] = useState(true);
  const [isTaxable, setIsTaxable] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name) return;
    setLoading(true);

    try {
      await fetch(`${API_BASE_URL}/company/${companyId}/allowance-types`, {
        method: "POST",
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

      // Reset form fields
      setName("");
      setDescription("");
      setIsCash(true);
      setIsTaxable(true);

      onUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to add allowance type", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Allowance Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="my-2" htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g. Housing, Meals, Car"/>
          </div>
          <div>
            <Label className="my-2" htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="E.g. Monthly housing allowance"/>
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
          <Button className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}