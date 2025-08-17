// src/components/company/payroll/allowances/AllowanceManageSection.tsx

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Import updated components
import AllowanceManageTable, { AllowanceType } from "./AllowanceManageTable";
import AddAllowanceDialog from "./AddAllowanceDialog";
import EditAllowanceDialog from "./EditAllowanceDialog";
import DeleteAllowanceDialog from "./DeleteAllowanceDialog";

const AllowanceManageSection = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();
  
  const [allowances, setAllowances] = useState<AllowanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState<AllowanceType | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId || !session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/company/${companyId}/allowance-types`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch allowances.");

      const data = await response.json();
      setAllowances(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    fetchData();
  };

  const handleEdit = (allowance: AllowanceType) => {
    setSelectedAllowance(allowance);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (allowance: AllowanceType) => {
    setSelectedAllowance(allowance);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    handleCloseEditDialog();
    fetchData();
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedAllowance(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAllowance(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Allowance Types</CardTitle>
            <CardDescription>
              Define and manage allowance types available in your company.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]"
          >
            Add Allowance Type
          </Button>
        </CardHeader>
        <CardContent>
          <AllowanceManageTable data={allowances} onEdit={handleEdit} onDelete={handleDelete} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddAllowanceDialog
        companyId={companyId!}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onUpdated={handleAddSuccess}
      />

      {isEditDialogOpen && selectedAllowance && (
        <EditAllowanceDialog
          allowance={selectedAllowance}
          companyId={companyId!}
          onClose={handleCloseEditDialog}
          onUpdated={handleUpdateSuccess}
        />
      )}

      {isDeleteDialogOpen && selectedAllowance && (
        <DeleteAllowanceDialog
          allowance={selectedAllowance}
          companyId={companyId!}
          onClose={handleCloseDeleteDialog}
          onDeleted={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default AllowanceManageSection;