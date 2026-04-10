// src/components/payroll/runs/ReviewProgress.tsx
import React from 'react';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
// Remove Progress import if not used
// import { Progress } from '@/components/ui/progress';

interface ReviewProgressProps {
  stats: {
    total_employees: number;
    approved: number;
    pending: number;
    rejected: number;
    completion_percentage: number;
    all_approved?: boolean;
    any_rejected?: boolean;
  };
  size?: 'sm' | 'md';
}

export const ReviewProgress: React.FC<ReviewProgressProps> = ({ 
  stats, 
  // Use size if needed, or remove it from props
  // size = 'md' 
}) => {
  // If you don't need size, remove it from the props destructuring above
  // and remove it from the interface if not needed
  
  const totalReviews = stats.approved + stats.pending + stats.rejected;
  const approvedPercentage = totalReviews > 0 
    ? Math.round((stats.approved / totalReviews) * 100) 
    : 0;
  const pendingPercentage = totalReviews > 0 
    ? Math.round((stats.pending / totalReviews) * 100) 
    : 0;
  const rejectedPercentage = totalReviews > 0 
    ? Math.round((stats.rejected / totalReviews) * 100) 
    : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 cursor-help">
          {/* Progress Bar */}
          <div className="flex-1 min-w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            {stats.approved > 0 && (
              <div 
                className="h-full bg-emerald-500 float-left"
                style={{ width: `${approvedPercentage}%` }}
              />
            )}
            {stats.pending > 0 && (
              <div 
                className="h-full bg-amber-500 float-left"
                style={{ width: `${pendingPercentage}%` }}
              />
            )}
            {stats.rejected > 0 && (
              <div 
                className="h-full bg-red-500 float-left"
                style={{ width: `${rejectedPercentage}%` }}
              />
            )}
          </div>
          
          {/* Status Icons */}
          <div className="flex items-center gap-1">
            {stats.all_approved && (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            )}
            {stats.any_rejected && (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            {!stats.all_approved && !stats.any_rejected && stats.pending > 0 && (
              <Clock className="h-4 w-4 text-amber-600" />
            )}
          </div>
          
          {/* Percentage */}
          <span className="text-xs font-medium text-slate-700 min-w-10">
            {stats.completion_percentage}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="w-64 p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">REVIEW PROGRESS</span>
            <span className="text-xs font-medium text-slate-700">
              {stats.completion_percentage}%
            </span>
          </div>
          
          <div className="space-y-2">
            {/* Employees count */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-slate-400" />
                <span>Total Employees</span>
              </div>
              <span className="font-medium">{stats.total_employees}</span>
            </div>
            
            {/* Approved */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.approved}</span>
                <span className="text-slate-400 text-xxs">
                  ({approvedPercentage}%)
                </span>
              </div>
            </div>
            
            {/* Pending */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.pending}</span>
                <span className="text-slate-400 text-xxs">
                  ({pendingPercentage}%)
                </span>
              </div>
            </div>
            
            {/* Rejected */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Rejected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.rejected}</span>
                <span className="text-slate-400 text-xxs">
                  ({rejectedPercentage}%)
                </span>
              </div>
            </div>
          </div>
          
          {/* Status Summary */}
          <div className="pt-2 border-t border-slate-100">
            {stats.all_approved && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                All items approved
              </p>
            )}
            {stats.any_rejected && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Some items need attention
              </p>
            )}
            {!stats.all_approved && !stats.any_rejected && stats.pending > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Waiting for reviews
              </p>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};