import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner'
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
//import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import OfflineBanner from '@/components/common/offlinebanner';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Username state
  const [username, setUsername] = useState(user?.user_metadata?.user_name || "");
  const [savingUsername, setSavingUsername] = useState(false);

  // Password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  async function handleUsernameSave() {
    try {
      setSavingUsername(true);
      const { error } = await supabase.auth.updateUser({
        data: { user_name: username },
      });
      if (error) throw error;
      toast.success("Username updated successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setSavingUsername(false);
    }
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setPasswordDialogOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  }

  async function handleEmailChange() {
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Email change successfully");
      setEmailDialogOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  }

  return (
    <div className="container mx-auto p-6">
      <OfflineBanner/>
      {/* Back button */}
      <Button
        variant="ghost"
        className="flex items-center gap-2 mb-4 text-[#7F5EFD]"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </Button>

      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      {/* Username Section */}
      <div className="mb-8 bg-white shadow rounded-lg p-6">
        <Label className="text-sm font-medium">Username</Label>
        <div className="flex gap-2 mt-2">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          <Button
            style={{ backgroundColor: "#7F5EFD" }}
            disabled={savingUsername}
            onClick={handleUsernameSave}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Email Section */}
      <div className="mb-8 bg-white shadow rounded-lg p-6">
        <Label className="text-sm font-medium">Email</Label>
        <p className="mt-1 text-gray-600">{user?.email}</p>
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-3">Change Email</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Email</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button style={{ backgroundColor: "#7F5EFD" }} onClick={handleEmailChange}>
                Update Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Password Section */}
      <div className="mb-8 bg-white shadow rounded-lg p-6">
        <Label className="text-sm font-medium">Password</Label>
        <p className="mt-1 text-gray-600">••••••••••••••</p>
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-3">Change Password</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Old Password</Label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button style={{ backgroundColor: "#7F5EFD" }} onClick={handlePasswordChange}>
                Update Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
