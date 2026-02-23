import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Inbox, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface JobTitle {
  id: string;
  title: string;
}

export function JobTitlesTable({ companyId }: { companyId: string }) {
 const [titles, setTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] =  useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  // Edit Dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<JobTitle | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const token = useAuthStore.getState().session?.access_token;

  const fetchTitles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/company/${companyId}/job-titles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTitles(res.data);
    } finally { setLoading(false); }
  }, [companyId, token]);

  const handleAdd = async () => {
     if (!newTitle) return;
    setSaveLoading(true)
    try {
      await axios.post(`${API_BASE_URL}/company/job-titles`, 
        { company_id: companyId, title: newTitle },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setNewTitle("");
      setIsAddOpen(false);
      fetchTitles();
      toast.success("Job title added");
    } catch (err) { 
      toast.error("Failed to add title"); 
    } finally {
       setSaveLoading(false)
     }
  };

  const handleEdit = async () => {
    if (!editingTitle || !editTitle) return;
    setSaveLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/company/job-titles/${editingTitle.id}`,
        { title: editTitle },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setIsEditOpen(false);
      setEditingTitle(null);
      setEditTitle("");
      fetchTitles();
      toast.success("Job title updated");
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setSaveLoading(false);
    }
  };

   const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/company/job-titles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTitles();
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const openEditDialog = (title: JobTitle) => {
    setEditingTitle(title);
    setEditTitle(title.title);
    setIsEditOpen(true);
  };

 useEffect(() => { 
    if (companyId) fetchTitles(); 
  }, [companyId, fetchTitles]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className='bg-[#1F3A8A]'><Plus className="h-4 w-4 mr-2" /> Add Title</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Job Title</DialogTitle></DialogHeader>
            <div className="py-4">
              <Input placeholder="e.g. Senior Accountant" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
             <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button className="bg-[#1F3A8A]" disabled={saveLoading || !newTitle} onClick={handleAdd}>
                {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Title"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border px-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={2} className="text-center py-6"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
            ) : titles.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center py-6 text-muted-foreground"><Inbox className="mx-auto mb-2 opacity-20"/>No job titles added</TableCell></TableRow>
            ) : (
              titles.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                   <TableCell className="text-right space-x-1">
                     <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(t)}
                      className="text-slate-500 hover:text-[#1F3A8A]"
                    >
                      <Pencil size={16} />
                    </Button>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                          <Trash2 size={16}/>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{t.title}" job title.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-500" onClick={() => handleDelete(t.id)}>
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
          <DialogHeader><DialogTitle>Edit Job Title</DialogTitle></DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Job title" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button className="bg-[#1F3A8A]" disabled={saveLoading || !editTitle} onClick={handleEdit}>
              {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Title"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}