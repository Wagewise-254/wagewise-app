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
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  absentDaysIds: string[];
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

export default function BulkDeleteAbsentDaysDialog({
  absentDaysIds,
  companyId,
  isOpen,
  onClose,
  onDeleted,
}: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/absent-days/bulk`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: absentDaysIds }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete records");
      }

      toast.success(
        `${absentDaysIds.length} absent days record(s) deleted successfully.`
      );
      onDeleted();
      onClose();
    } catch (error) {
      console.error("Failed to delete records", error);
      toast.error("Failed to delete records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const message =
    absentDaysIds.length === 1
      ? "Are you sure you want to delete this absent days record? This action cannot be undone."
      : `Are you sure you want to delete these ${absentDaysIds.length} absent days records? This action cannot be undone.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete Absent Days Record{absentDaysIds.length > 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>
        <p>{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}