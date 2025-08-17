// src/components/company/payroll/allowances/DeleteAllowanceDialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Allowance } from "./AllowanceAssignTable";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  allowance: Allowance;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteAllowanceDialog({ allowance, companyId, isOpen, onClose, onDeleted }: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/allowances/${allowance.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete allowance");
      }

      toast.success("Allowance deleted successfully.");

      onDeleted();
      onClose();
    } catch (err) {
      console.error("Failed to delete allowance", err);
      toast.error("Failed to delete allowance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Assigned Allowance</DialogTitle>
        </DialogHeader>
        <p>
          Are you sure you want to delete the allowance <b>{allowance.allowance_types.name}</b> for employee{" "}
          <b>{`${allowance.employees.first_name} ${allowance.employees.last_name}`}</b>? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}