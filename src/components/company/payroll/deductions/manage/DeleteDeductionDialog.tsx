// src/components/company/payroll/deductions/DeleteDeductionDialog.tsx

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
import { DeductionType } from "./DeductionManageTable";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  deduction: DeductionType;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteDeductionDialog({ deduction, companyId, isOpen, onClose, onDeleted }: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/deduction-types/${deduction.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete deduction type");
      }

      toast.success("Deduction type deleted successfully.");

      onDeleted();
      onClose();
    } catch (err) {
      console.error("Failed to delete deduction type", err);
      toast.error("Failed to delete deduction type. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Deduction Type</DialogTitle>
        </DialogHeader>
        <p>
          Are you sure you want to delete <b>{deduction.name}</b>? This action cannot be undone.
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