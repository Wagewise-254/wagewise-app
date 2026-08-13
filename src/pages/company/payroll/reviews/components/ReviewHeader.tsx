import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  RefreshCw,
  XCircle,
  CheckCircle2,
  MoreVertical,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PAYROLL_STATUS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ReviewHeaderProps {
  payroll: {
    id: string;
    payroll_number: string;
    payroll_month: string;
    payroll_year: number;
    status: string;
    total_employees: number;
    eligible_count: number;
  };
  canRecalculate: boolean;
  canApprove: boolean;
  isFullyApproved: boolean;
  onRecalculate: () => void;
  onCancel: () => void;
  onApprove: () => void;
  onRevert: () => void;
  isRecalculating: boolean;
  isCancelling: boolean;
  isApproving: boolean;
  isReverting: boolean;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PREPARED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  LOCKED: 'bg-purple-50 text-purple-700',
  PAID: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
  REJECTED: 'bg-red-50 text-red-700',
};

export function ReviewHeader({
  payroll,
  canRecalculate,
  canApprove,
  isFullyApproved,
  onRecalculate,
  onCancel,
  onApprove,
  onRevert,
  isRecalculating,
  isCancelling,
  isApproving,
  isReverting,
}: ReviewHeaderProps) {
  const { companyId, payrollRunId } = useParams<{ companyId: string; payrollRunId: string }>();
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);

  const canCancel = ['DRAFT', 'PREPARED', 'UNDER_REVIEW'].includes(
    payroll.status,
  );

  const isApproved = payroll.status === PAYROLL_STATUS.APPROVED;
  const isLocked = payroll.status === PAYROLL_STATUS.LOCKED;
  const isPaid = payroll.status === PAYROLL_STATUS.PAID;

  const canRevert = isApproved || isLocked || isPaid;

  const handleRecalculate = () => {
    setShowRecalculateDialog(false);
    onRecalculate();
  };

  const handleCancel = () => {
    setShowCancelDialog(false);
    onCancel();
  };

  const handleApprove = () => {
    setShowApproveDialog(false);
    onApprove();
  };

  const handleRevert = () => {
    setShowRevertDialog(false);
    onRevert();
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Review & Approve
            </h1>

            <Badge
              className={cn(
                statusColors[payroll.status] ||
                  'bg-slate-100 text-slate-700',
                'rounded-sm border-0 capitalize',
              )}
            >
              {payroll.status?.replace('_', ' ') || 'Unknown'}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {payroll.payroll_number} · {payroll.payroll_month}{' '}
            {payroll.payroll_year}
          </p>
        </div>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Recalculate */}
          {canRecalculate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecalculateDialog(true)}
              disabled={isRecalculating}
              className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw
                className={cn(
                  'mr-2 h-4 w-4',
                  isRecalculating && 'animate-spin',
                )}
              />
              {isRecalculating ? 'Recalculating...' : 'Recalculate'}
            </Button>
          )}

          {/* Approve Payroll */}
          {!isApproved && (
            <Button
              size="sm"
              onClick={() =>
                canApprove &&
                isFullyApproved &&
                setShowApproveDialog(true)
              }
              disabled={
                !canApprove ||
                !isFullyApproved ||
                isApproving ||
                isRecalculating
              }
              className={`h-9 bg-[#7F5EFD] text-white hover:bg-[#6b4de0] ${
                (!canApprove || !isFullyApproved) &&
                'cursor-not-allowed opacity-50'
                }`}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isApproving ? 'Approving...' : 'Approve Payroll'}
            </Button>
          )}

          {/* Approved → View Payroll */}
          {isApproved && (
            <Link to={`/company/${companyId}/payroll/${payrollRunId}/hub`}>
              <Button
                size="sm"
                className="h-9 bg-[#7F5EFD] text-white hover:bg-[#6b4de0]"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Payroll
              </Button>
            </Link>
          )}

          {/* More actions */}
          {(canCancel || canRevert) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-slate-200 bg-white hover:bg-slate-50"
                >
                  <MoreVertical className="mr-2 h-4 w-4 text-slate-600" />
                  Actions
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                {/* Revert */}
                {canRevert && (
                  <DropdownMenuItem
                    onClick={() => setShowRevertDialog(true)}
                    disabled={isReverting}
                    className="cursor-pointer text-amber-600 focus:text-amber-600"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {isReverting ? 'Reverting...' : 'Revert to Review'}
                  </DropdownMenuItem>
                )}

                {/* Separator */}
                {canRevert && canCancel && <DropdownMenuSeparator />}

                {/* Cancel */}
                {canCancel && (
                  <DropdownMenuItem
                    onClick={() => setShowCancelDialog(true)}
                    disabled={isCancelling}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {isCancelling ? 'Cancelling...' : 'Cancel Payroll'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Recalculate Dialog */}
      <AlertDialog
        open={showRecalculateDialog}
        onOpenChange={setShowRecalculateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalculate Payroll</AlertDialogTitle>
            <AlertDialogDescription>
              This will recalculate all payroll values for this run. Some
              existing reviews might be reset to pending. Are you sure you want
              to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleRecalculate}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Recalculate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Dialog */}
      <AlertDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Payroll</AlertDialogTitle>

            <AlertDialogDescription>
              All employees have been reviewed and approved. This will finalize
              the payroll run. Are you sure you want to approve?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Approve Payroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Payroll</AlertDialogTitle>

            <AlertDialogDescription>
              This will cancel the current payroll run. All data will be
              preserved but the run will be marked as cancelled. Are you sure
              you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Payroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert Dialog */}
      <AlertDialog
        open={showRevertDialog}
        onOpenChange={setShowRevertDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to Draft</AlertDialogTitle>

            <AlertDialogDescription>
              This will revert the payroll run back to "Under Review" status. Are you sure you want to revert?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleRevert}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Revert to Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}