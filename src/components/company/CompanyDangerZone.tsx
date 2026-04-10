import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  companyId: string;
  companyName: string;
}

export function CompanyDangerZone({ companyId, companyName }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const handleDelete = async () => {
    if (confirmName !== companyName) {
      toast.error("Company name does not match");
      return;
    }

    // Implement delete logic here
    toast.error("This action is disabled in demo");
    console.log(companyId)
    setShowDeleteDialog(false);
    setConfirmName("");
  };

  return (
    <>
      <Card className="border-red-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
            <div>
              <h4 className="text-sm font-semibold text-red-900">Delete Company</h4>
              <p className="text-xs text-red-700 mt-1">
                Once deleted, all employee data, payroll records, and settings will be permanently removed.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Company
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-semibold text-red-600">{companyName}</span>{' '}
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm">
                Type <span className="font-semibold">{companyName}</span> to confirm
              </Label>
              <Input
                id="confirm"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={companyName}
                className="border-red-200 focus:border-red-600"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}