import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandItem,
  CommandList,
  CommandGroup,
  CommandInput,
  CommandEmpty,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  ChevronsUpDown,
  Trash2,
  Plus,
  Loader2,
  Inbox,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SubDept {
  id: string;
  name: string;
  type: string;
  department_id: string;
}

interface Dept {
  id: string;
  name: string;
}

export function SubDepartmentsTable({
  companyId,
  departments,
}: {
  companyId: string;
  departments: Dept[];
}) {
  const [subs, setSubs] = useState<SubDept[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Add Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("SUB_DEPARTMENT");
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Edit Dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubDept | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editPopoverOpen, setEditPopoverOpen] = useState(false);

  const token = useAuthStore.getState().session?.access_token;

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/company/${companyId}/sub-departments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSubs(res.data);
    } catch (err) {
      toast.error("Failed to load sub-units");
    } finally {
      setLoading(false);
    }
  }, [companyId, token]);

  const handleSave = async () => {
    if (!name || !selectedDeptId) return toast.error("Please fill all fields");
    setSaveLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/company/sub-departments`,
        {
          company_id: companyId,
          department_id: selectedDeptId,
          name,
          type,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Unit added");
      setIsAddOpen(false);
      setName("");
      setSelectedDeptId("");
      setType("SUB_DEPARTMENT");
      fetchSubs();
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingSub || !editName || !editDeptId) return;
    setSaveLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/company/sub-departments/${editingSub.id}`,
        {
          name: editName,
          type: editType,
          department_id: editDeptId,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Unit updated");
      setIsEditOpen(false);
      setEditingSub(null);
      fetchSubs();
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/company/sub-departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubs();
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const openEditDialog = (sub: SubDept) => {
    setEditingSub(sub);
    setEditName(sub.name);
    setEditType(sub.type);
    setEditDeptId(sub.department_id);
    setIsEditOpen(true);
  };

  useEffect(() => {
    if (companyId) fetchSubs();
  }, [companyId, fetchSubs]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1F3A8A]">
              <Plus className="h-4 w-4 mr-2" /> Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sub-Unit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Parent Department</label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {selectedDeptId
                        ? departments.find((d) => d.id === selectedDeptId)?.name
                        : "Select Department..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-100 p-0">
                    <Command>
                      <CommandInput placeholder="Search departments..." />
                      <CommandEmpty>No department found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {departments.map((dept) => (
                            <CommandItem
                              key={dept.id}
                              onSelect={() => {
                                setSelectedDeptId(dept.id);
                                setPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedDeptId === dept.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {dept.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Name</label>
                <Input
                  placeholder="e.g. Payroll Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="SUB_DEPARTMENT">Sub Department</option>
                  <option value="PROJECT">Project</option>
                  <option value="SECTION">Section</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button className="bg-[#1F3A8A]" disabled={saveLoading || !name || !selectedDeptId} onClick={handleSave}>
                {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Unit"}
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
              <TableHead>Type</TableHead>
              <TableHead>Parent Dept</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : subs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-muted-foreground"
                >
                  <Inbox className="mx-auto mb-2 opacity-20" />
                  No sub-units found
                </TableCell>
              </TableRow>
            ) : (
              subs.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell className="capitalize">
                    {sub.type.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    {departments.find((d) => d.id === sub.department_id)
                      ?.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(sub)}
                      className="text-slate-500 hover:text-[#1F3A8A]"
                    >
                      <Pencil size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{sub.name}" {sub.type.replace("_", " ").toLowerCase()}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-500" onClick={() => handleDelete(sub.id)}>
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
            <DialogTitle>Edit Sub-Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Department</label>
              <Popover open={editPopoverOpen} onOpenChange={setEditPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                  >
                    {editDeptId
                      ? departments.find((d) => d.id === editDeptId)?.name
                      : "Select Department..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-100 p-0">
                  <Command>
                    <CommandInput placeholder="Search departments..." />
                    <CommandEmpty>No department found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {departments.map((dept) => (
                          <CommandItem
                            key={dept.id}
                            onSelect={() => {
                              setEditDeptId(dept.id);
                              setEditPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                editDeptId === dept.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {dept.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Name</label>
              <Input
                placeholder="e.g. Payroll Project"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="SUB_DEPARTMENT">Sub Department</option>
                <option value="PROJECT">Project</option>
                <option value="SECTION">Section</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button className="bg-[#1F3A8A]" disabled={saveLoading || !editName || !editDeptId} onClick={handleEdit}>
              {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}