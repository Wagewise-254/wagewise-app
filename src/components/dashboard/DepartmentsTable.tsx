import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Loader2, Inbox, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Department {
  id: string;
  name: string;
}

interface DepartmentsTableProps {
  companyId: string;
  onDepartmentsChange?: (depts: Department[]) => void;
}

export function DepartmentsTable({
  companyId,
  onDepartmentsChange,
}: DepartmentsTableProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const token = useAuthStore.getState().session?.access_token;

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/company/${companyId}/departments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setDepartments(res.data);
      onDepartmentsChange?.(res.data);
    } catch (err) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [companyId, token, onDepartmentsChange]);

  const handleAdd = async () => {
    if (!newName) return;
    setSaveLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/company/departments`,
        { company_id: companyId, name: newName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewName("");
      setIsAddOpen(false);
      fetchDepartments();
      toast.success("Department added");
    } catch (err) {
      toast.error("Failed to add");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingDept || !editName) return;
    setSaveLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/company/departments/${editingDept.id}`,
        { name: editName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsEditOpen(false);
      setEditingDept(null);
      setEditName("");
      fetchDepartments();
      toast.success("Department updated");
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/company/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDepartments();
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Could not delete. Check if it has sub-units.");
    }
  };

  const openEditDialog = (dept: Department) => {
    setEditingDept(dept);
    setEditName(dept.name);
    setIsEditOpen(true);
  };

  useEffect(() => {
    if (companyId) fetchDepartments();
  }, [companyId, fetchDepartments]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1F3A8A]">
              <Plus className="h-4 w-4 mr-2" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="e.g. Finance, Operations"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#1F3A8A]"
                disabled={saveLoading || !newName}
                onClick={handleAdd}
              >
                {saveLoading ? (
                  <Loader2 className="mr-2 cursor-not-allowed h-4 w-4 animate-spin" />
                ) : (
                  "Save Department"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border px-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="h-24 text-center text-muted-foreground"
                >
                  <Inbox className="mx-auto h-8 w-8 mb-2 opacity-20" />
                  No departments added yet.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(dept)}
                      className="text-slate-500 hover:text-[#1F3A8A] cursor-pointer"
                    >
                      <Pencil size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{dept.name}"
                            department.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500"
                            onClick={() => handleDelete(dept.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Department name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#1F3A8A]"
              disabled={saveLoading || !editName}
              onClick={handleEdit}
            >
              {saveLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update Department"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
