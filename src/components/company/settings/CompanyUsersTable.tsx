import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Copy, CheckCircle, Loader2, MoreVertical, Mail, Key, Ban, Trash2, Shield, UserCog } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

interface ApiError {
  error: string;
}

interface CompanyUser {
  id: string;
  company_user_id: string;
  email: string;
  full_names: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  workspace_role?: string;
  created_at: string;
  status: 'ACTIVE' | 'SUSPENDED';
  last_sign_in?: string;
}

export default function CompanyUsersTable() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Invite Dialog
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullNames, setInviteFullNames] = useState("");
  const [inviteRole, setInviteRole] = useState<CompanyUser['role']>('VIEWER');
  const [sendEmail, setSendEmail] = useState(true);
  
  // Success Dialog
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [newUser, setNewUser] = useState<{
    email: string;
    full_names: string;
    role: string;
    temporary_password?: string;
    is_existing_user: boolean;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Role Change Dialog
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [newRole, setNewRole] = useState<CompanyUser['role']>('VIEWER');

  // Confirm Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<CompanyUser | null>(null);

  const token = useAuthStore.getState().session?.access_token;

  const fetchUsers = useCallback(async () => {
  if (!companyId || !token) return;
  
  setLoading(true);
  try {
    const res = await axios.get(`${API_BASE_URL}/company/${companyId}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(res.data);
  } catch (error) {
    toast.error("Failed to load users");
  } finally {
    setLoading(false);
  }
}, [companyId, token]); // Add dependencies

useEffect(() => {
  fetchUsers();
}, [fetchUsers]); // Now depends on the stable callback

  const handleInvite = async () => {
    if (!inviteEmail || !inviteFullNames || !inviteRole) {
      toast.error("Please fill all fields");
      return;
    }

    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/company/${companyId}/users`,
        {
          email: inviteEmail,
          full_names: inviteFullNames,
          role: inviteRole,
          send_email: sendEmail,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewUser(res.data.user);
      setIsInviteOpen(false);
      setIsSuccessOpen(true);
      
      // Reset form
      setInviteEmail("");
      setInviteFullNames("");
      setInviteRole('VIEWER');
      setSendEmail(true);
      
      // Refresh list
      fetchUsers();
      toast.success("User added successfully");
    } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || "Failed to add user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    setActionLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/company/${companyId}/users/${selectedUser.id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Role updated successfully");
      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
         const axiosError = error as AxiosError<ApiError>;
      toast.error( axiosError.response?.data?.error || "Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (user: CompanyUser, suspend: boolean) => {
    setActionLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/company/${companyId}/users/${user.id}/suspend`,
        { suspend },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(suspend ? "User suspended" : "User activated");
      fetchUsers();
    } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (user: CompanyUser) => {
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/company/${companyId}/users/${user.id}/reset-password`,
        { send_email: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewUser({
        email: user.email,
        full_names: user.full_names,
        role: user.role,
        temporary_password: res.data.temporary_password,
        is_existing_user: true,
      });
      
      setIsSuccessOpen(true);
      toast.success("Password reset successfully");
    } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCredentials = async (user: CompanyUser) => {
    setActionLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/company/${companyId}/users/${user.id}/send-credentials`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Credentials sent successfully");
    } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || "Failed to send credentials");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    setActionLoading(true);
    try {
      await axios.delete(
        `${API_BASE_URL}/company/${companyId}/users/${userToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("User removed successfully");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || "Failed to remove user");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users who have access to this company
          </p>
        </div>
        <Button 
          onClick={() => setIsInviteOpen(true)} 
          className="bg-[#1F3A8A] hover:bg-[#162a63]"
        >
          <UserCog className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="bg-white border rounded-md  px-2 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[30%]">Name</TableHead>
              <TableHead className="w-[30%]">Email</TableHead>
              <TableHead className="w-[15%]">Role</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[10%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  No team members added yet
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {user.full_names}
                      {user.id === currentUser?.id && (
                        <Badge variant="secondary" className="ml-2">You</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={cn("font-normal", getRoleBadgeColor(user.role))}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "font-normal",
                        user.status === 'ACTIVE' 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      )}
                    >
                      {user.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={user.id === currentUser?.id}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {/* Role Change */}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setIsRoleDialogOpen(true);
                          }}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>

                        {/* Send Credentials */}
                        <DropdownMenuItem onClick={() => handleSendCredentials(user)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Credentials
                        </DropdownMenuItem>

                        {/* Reset Password */}
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>

                        {/* Suspend/Activate */}
                        <DropdownMenuItem 
                          onClick={() => handleSuspend(user, user.status === 'ACTIVE')}
                          className={user.status === 'ACTIVE' ? 'text-yellow-600' : 'text-green-600'}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          {user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Delete */}
                        <DropdownMenuItem 
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Company
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new user to this company. They will receive access to WageDesk.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullNames">Full Names</Label>
              <Input
                id="fullNames"
                placeholder="e.g. John Doe"
                value={inviteFullNames}
                onChange={(e) => setInviteFullNames(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Admin: Full access • Manager: Can edit • Viewer: Read only
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="sendEmail" 
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              />
              <Label htmlFor="sendEmail" className="text-sm font-normal">
                Send login credentials via email
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#1F3A8A]"
              disabled={actionLoading || !inviteEmail || !inviteFullNames}
              onClick={handleInvite}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog with Credentials */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              {newUser?.is_existing_user 
                ? "Password Reset Successful" 
                : "User Added Successfully"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {newUser?.is_existing_user 
                ? "A new password has been generated for this user."
                : "The user has been created and added to the company."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm font-mono">{newUser?.email}</span>
              </div>
              
              {newUser?.temporary_password && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Temporary Password</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {showPassword ? newUser.temporary_password : '••••••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(newUser.temporary_password!)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Role</span>
                <Badge className={getRoleBadgeColor(newUser?.role || 'VIEWER')}>
                  {newUser?.role}
                </Badge>
              </div>
            </div>

            {!newUser?.is_existing_user && (
              <p className="text-sm text-muted-foreground">
                The user will be prompted to change this password on first login.
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-center">
            {!newUser?.temporary_password ? (
              <Button 
                variant="outline"
                onClick={() => setIsSuccessOpen(false)}
              >
                Close
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => copyToClipboard(newUser.temporary_password!)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Password
                </Button>
                <Button 
                  className="flex-1 bg-[#1F3A8A]"
                  onClick={() => {
                    setIsSuccessOpen(false);
                    // Optionally send email again
                  }}
                >
                  Done
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedUser?.full_names}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#1F3A8A]"
              disabled={actionLoading || newRole === selectedUser?.role}
              onClick={handleRoleChange}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {userToDelete?.full_names} from this company?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={actionLoading}
              onClick={handleDelete}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}