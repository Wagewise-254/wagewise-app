// src/components/company/payroll/allowances/AllowanceAssignSection.tsx

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import AllowanceAssignTable, { Allowance } from "./AllowanceAssignTable";
import AddAllowanceDialog from "./AddAllowanceDialog";
import EditAllowanceDialog from "./EditAllowanceDialog";
import DeleteAllowanceDialog from "./DeleteAllowanceDialog";

const AllowanceAssignSection = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();

  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState<Allowance | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/allowances`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch allowances");
      }

      const data = await response.json();
      setAllowances(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load allowances. Please try again.");
      toast.error("Failed to load allowances.");
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSuccess = () => {
    fetchData();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (allowance: Allowance) => {
    setSelectedAllowance(allowance);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (allowance: Allowance) => {
    setSelectedAllowance(allowance);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedAllowance(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAllowance(null);
  };

  const handleUpdateSuccess = () => {
    fetchData();
    handleCloseEditDialog();
    handleCloseDeleteDialog();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Assigned Allowances</CardTitle>
            <CardDescription>
              Manage allowances assigned to employees.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]"
          >
            Assign Allowance
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              {error}
            </div>
          ) : (
            <AllowanceAssignTable data={allowances} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {isAddDialogOpen && (
        <AddAllowanceDialog
          companyId={companyId!}
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onUpdated={handleAddSuccess}
        />
      )}

      {isEditDialogOpen && selectedAllowance && (
        <EditAllowanceDialog
          allowance={selectedAllowance}
          companyId={companyId!}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onUpdated={handleUpdateSuccess}
        />
      )}

      {isDeleteDialogOpen && selectedAllowance && (
        <DeleteAllowanceDialog
          allowance={selectedAllowance}
          companyId={companyId!}
          isOpen={isDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onDeleted={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default AllowanceAssignSection;