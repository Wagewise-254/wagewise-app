import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  MoreVertical,
  Loader2,
  Trash2,
  UserPlus,
  AlertCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanyUser {
  company_user_id: string;
  user_id: string;
  email: string;
  full_names: string;
  role: "ADMIN" | "MANAGER" | "VIEWER";
  status: "ACTIVE" | "SUSPENDED";
}

interface CompanyReviewer {
  id: string;
  reviewer_level: number;
  created_at: string;
  company_user_id: string;
  user_id: string;
  email: string;
  full_names: string;
  role: "ADMIN" | "MANAGER";
  status: "ACTIVE" | "SUSPENDED";
  last_sign_in?: string;
}

interface ApiError {
  error: string;
}

interface SortableRowProps {
  reviewer: CompanyReviewer;
  onMoveUp: (reviewer: CompanyReviewer) => void;
  onMoveDown: (reviewer: CompanyReviewer) => void;
  onEdit: (reviewer: CompanyReviewer) => void;
  onRemove: (reviewer: CompanyReviewer) => void;
  isFirst: boolean;
  isLast: boolean;
  currentUserId?: string;
}

const SortableRow = ({
  reviewer,
  onMoveUp,
  onMoveDown,
  onEdit,
  onRemove,
  isFirst,
  isLast,
  currentUserId,
}: SortableRowProps) => {
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="w-24">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMoveUp(reviewer)}
            disabled={isFirst}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMoveDown(reviewer)}
            disabled={isLast}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center">
          {reviewer.full_names}
          {reviewer.user_id === currentUserId && (
            <Badge variant="secondary" className="ml-2 text-xs">
              You
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{reviewer.email}</TableCell>
      <TableCell>
        <Badge
          className={cn(
            "font-normal",
            reviewer.role === "ADMIN"
              ? "bg-red-100 text-red-800 hover:bg-red-100"
              : "bg-blue-100 text-blue-800 hover:bg-blue-100",
          )}
        >
          {reviewer.role}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-sm px-3 py-1",
              "bg-purple-50 text-purple-700 border-purple-200",
            )}
          >
            Level {reviewer.reviewer_level}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            "font-normal",
            reviewer.status === "ACTIVE"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-yellow-50 text-yellow-700 border-yellow-200",
          )}
        >
          {reviewer.status === "ACTIVE" ? "Active" : "Suspended"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={reviewer.user_id === currentUserId}
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(reviewer)}>
              <Shield className="h-4 w-4 mr-2" />
              Change Level
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onRemove(reviewer)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Reviewer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function CompanyReviewersTable() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user: currentUser } = useAuthStore();
  const [reviewers, setReviewers] = useState<CompanyReviewer[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Reviewer Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCompanyUserId, setSelectedCompanyUserId] = useState("");
  const [reviewerLevel, setReviewerLevel] = useState("1");

  // Edit Level Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedReviewer, setSelectedReviewer] =
    useState<CompanyReviewer | null>(null);
  const [editLevel, setEditLevel] = useState("1");

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reviewerToDelete, setReviewerToDelete] =
    useState<CompanyReviewer | null>(null);

  const token = useAuthStore.getState().session?.access_token;
  const navigate = useNavigate();

  const fetchReviewers = useCallback(async () => {
    if (!companyId || !token) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/company/${companyId}/reviewers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setReviewers(response.data);
    } catch (error) {
      toast.error("Failed to load reviewers");
    } finally {
      setLoading(false);
    }
  }, [companyId, token]);

  const fetchEligibleUsers = useCallback(async () => {
    if (!companyId || !token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/company/${companyId}/reviewers/eligible`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setEligibleUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch eligible users:", error);
    }
  }, [companyId, token]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  const handleAddReviewer = async () => {
    if (!selectedCompanyUserId || !reviewerLevel) {
      toast.error("Please select a user and set reviewer level");
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/company/${companyId}/reviewers`,
        {
          company_user_id: selectedCompanyUserId,
          reviewer_level: parseInt(reviewerLevel),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Reviewer added successfully");
      setIsAddDialogOpen(false);
      setSelectedCompanyUserId("");
      setReviewerLevel("1");
      fetchReviewers();
      fetchEligibleUsers();
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || "Failed to add reviewer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLevel = async () => {
    if (!selectedReviewer || !editLevel) return;

    setActionLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/company/${companyId}/reviewers/${selectedReviewer.id}`,
        { reviewer_level: parseInt(editLevel) },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Reviewer level updated");
      setIsEditDialogOpen(false);
      setSelectedReviewer(null);
      fetchReviewers();
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || "Failed to update level");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveReviewer = async () => {
    if (!reviewerToDelete) return;

    setActionLoading(true);
    try {
      await axios.delete(
        `${API_BASE_URL}/company/${companyId}/reviewers/${reviewerToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Reviewer removed successfully");
      setIsDeleteDialogOpen(false);
      setReviewerToDelete(null);
      fetchReviewers();
      fetchEligibleUsers();
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      toast.error(
        axiosError.response?.data?.error || "Failed to remove reviewer",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveUp = async (reviewer: CompanyReviewer) => {
    if (reviewer.reviewer_level <= 1) return;

    const targetLevel = reviewer.reviewer_level - 1;
    const targetReviewer = reviewers.find(
      (r) => r.reviewer_level === targetLevel,
    );

    if (!targetReviewer) return;

    setActionLoading(true);
    try {
      // Swap levels
      await axios.post(
        `${API_BASE_URL}/company/${companyId}/reviewers/reorder`,
        {
          reviewers: [
            { id: reviewer.id, reviewer_level: targetLevel },
            { id: targetReviewer.id, reviewer_level: reviewer.reviewer_level },
          ],
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Reviewer moved up");
      fetchReviewers();
    } catch (error) {
      toast.error("Failed to reorder reviewers");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveDown = async (reviewer: CompanyReviewer) => {
    if (reviewer.reviewer_level >= reviewers.length) return;

    const targetLevel = reviewer.reviewer_level + 1;
    const targetReviewer = reviewers.find(
      (r) => r.reviewer_level === targetLevel,
    );

    if (!targetReviewer) return;

    setActionLoading(true);
    try {
      // Swap levels
      await axios.post(
        `${API_BASE_URL}/company/${companyId}/reviewers/reorder`,
        {
          reviewers: [
            { id: reviewer.id, reviewer_level: targetLevel },
            { id: targetReviewer.id, reviewer_level: reviewer.reviewer_level },
          ],
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Reviewer moved down");
      fetchReviewers();
    } catch (error) {
      toast.error("Failed to reorder reviewers");
    } finally {
      setActionLoading(false);
    }
  };

  const openAddDialog = () => {
    fetchEligibleUsers();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (reviewer: CompanyReviewer) => {
    setSelectedReviewer(reviewer);
    setEditLevel(reviewer.reviewer_level.toString());
    setIsEditDialogOpen(true);
  };

  const getReviewFlowDescription = (level: number) => {
    switch (level) {
      case 1:
        return "First level review - Initial check";
      case 2:
        return "Second level review - Manager approval";
      case 3:
        return "Third level review - Senior approval";
      default:
        return `${level}th level review`;
    }
  };

  // Sort reviewers by level for display
  const sortedReviewers = [...reviewers].sort(
    (a, b) => a.reviewer_level - b.reviewer_level,
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => navigate(`/company/${companyId}/modules`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back</p>
            </TooltipContent>
          </Tooltip>
          <div>
            <h2 className="text-2xl font-bold">Payroll Reviewers</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure the approval workflow for payroll runs. Reviewers are
              assigned in sequential order.
            </p>
          </div>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-[#1F3A8A] hover:bg-[#162a63]"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Reviewer
        </Button>
      </div>

      {/* Info Banner */}
      {reviewers.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">
              No reviewers configured
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Add reviewers to set up an approval workflow. Payroll runs will
              require approval from each reviewer in sequence.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-24">Reorder</TableHead>
              <TableHead className="w-[20%]">Name</TableHead>
              <TableHead className="w-[25%]">Email</TableHead>
              <TableHead className="w-[12%]">Role</TableHead>
              <TableHead className="w-[15%]">Review Level</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[10%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : reviewers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-gray-500"
                >
                  No reviewers added yet
                </TableCell>
              </TableRow>
            ) : (
              sortedReviewers.map((reviewer, index) => (
                <SortableRow
                  key={reviewer.id}
                  reviewer={reviewer}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onEdit={openEditDialog}
                  onRemove={() => {
                    setReviewerToDelete(reviewer);
                    setIsDeleteDialogOpen(true);
                  }}
                  isFirst={index === 0}
                  isLast={index === sortedReviewers.length - 1}
                  currentUserId={currentUser?.id}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Flow Visualization */}
      {reviewers.length > 1 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-700">Approval Workflow</h3>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {sortedReviewers.map((reviewer, index) => (
              <div key={reviewer.id} className="flex items-center">
                <div className="bg-white border rounded-lg px-3 py-2 shadow-sm">
                  <div className="text-xs text-gray-500">
                    Level {reviewer.reviewer_level}
                  </div>
                  <div className="font-medium text-sm">
                    {reviewer.full_names}
                  </div>
                  <div className="text-xs text-gray-600">{reviewer.role}</div>
                </div>
                {index < reviewers.length - 1 && (
                  <ArrowRight className="h-5 w-5 mx-2 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Reviewer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Add Payroll Reviewer</DialogTitle>
            <DialogDescription>
              Select a user to act as a payroll reviewer. Only ADMIN and MANAGER
              users can be reviewers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select User</Label>
              <Select
                value={selectedCompanyUserId}
                onValueChange={setSelectedCompanyUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleUsers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No eligible users available
                    </SelectItem>
                  ) : (
                    eligibleUsers.map((user) => (
                      <SelectItem
                        key={user.company_user_id}
                        value={user.company_user_id}
                      >
                        {user.full_names} ({user.email}) - {user.role}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {eligibleUsers.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No eligible users found. Users need to be ADMIN or MANAGER to
                  be reviewers.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Reviewer Level</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max={reviewers.length + 1}
                value={reviewerLevel}
                onChange={(e) => setReviewerLevel(e.target.value)}
                placeholder="Enter level number (1, 2, 3...)"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers review first. Levels will be automatically
                adjusted if needed.
                {reviewers.length > 0 && (
                  <span className="block mt-1">
                    Current levels:{" "}
                    {sortedReviewers.map((r) => r.reviewer_level).join(" → ")}
                  </span>
                )}
              </p>
            </div>

            {selectedCompanyUserId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Review flow position:</strong>{" "}
                    {getReviewFlowDescription(parseInt(reviewerLevel) || 1)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#1F3A8A] hover:bg-[#162a63]"
              disabled={
                actionLoading || !selectedCompanyUserId || !reviewerLevel
              }
              onClick={handleAddReviewer}
            >
              {actionLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Add Reviewer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Level Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Change Review Level</DialogTitle>
            <DialogDescription>
              Update review level for {selectedReviewer?.full_names}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editLevel">Reviewer Level</Label>
              <Input
                id="editLevel"
                type="number"
                min="1"
                max={reviewers.length}
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current level: {selectedReviewer?.reviewer_level}
              </p>
            </div>

            {selectedReviewer && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Current position:</span>{" "}
                  {getReviewFlowDescription(selectedReviewer.reviewer_level)}
                  {parseInt(editLevel) !== selectedReviewer.reviewer_level && (
                    <>
                      <ArrowRight className="h-3 w-3 inline mx-1" />
                      {getReviewFlowDescription(parseInt(editLevel))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#1F3A8A] hover:bg-[#162a63]"
              disabled={
                actionLoading ||
                !editLevel ||
                editLevel === selectedReviewer?.reviewer_level.toString()
              }
              onClick={handleUpdateLevel}
            >
              {actionLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Update Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Remove Reviewer</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {reviewerToDelete?.full_names} as
              a payroll reviewer? This action cannot be undone and will affect
              the approval workflow.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={handleRemoveReviewer}
            >
              {actionLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Remove Reviewer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ArrowRight component using lucide-react
const ArrowRight = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
