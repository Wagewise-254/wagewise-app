import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  Receipt,
  UserX,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
//import { cn } from '@/lib/utils';
import { ReviewStatusResponse, Reviewer } from '../types';

interface SidebarProps {
  reviewStatus: ReviewStatusResponse | null;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  totalAllowances: number;
  totalEmployees: number;
  ineligibleCount: number;
  reviewers: Reviewer[];
  isLoading: boolean;
}

export function Sidebar({
  reviewStatus,
  totalGross,
  totalNet,
  totalDeductions,
  totalAllowances,
  totalEmployees,
  ineligibleCount,
  reviewers,
  isLoading,
}: SidebarProps) {
  const { companyId, payrollRunId } = useParams<{ companyId: string; payrollRunId: string }>();
    const navigate = useNavigate();
  const approvedCount = reviewStatus?.steps?.reduce((sum, s) => sum + s.approved_items, 0) || 0;
  
  console.log(reviewStatus)
  // Total eligible employees (not total employees)
  const totalEligible = reviewStatus?.summary?.eligibleEmployees || 0;
  
  const completionPercentage = totalEligible > 0
    ? Math.round((approvedCount / totalEligible) * 100)
    : 0;


  //const pendingCount = totalItems - approvedCount;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-200 shadow-none rounded-sm">
            <CardContent className="p-4">
              <div className="h-20 bg-slate-100 animate-pulse rounded-sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <aside className="space-y-4">
      {/* Review Progress */}
<Card className="border-slate-200 shadow-none rounded-sm">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-semibold text-slate-900">
        Review
      </CardTitle>
      <span className="text-sm font-bold text-slate-900">
        {completionPercentage}%
      </span>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    <Progress value={completionPercentage} className="h-2" />
    <p className="text-xs text-slate-500">
  {approvedCount} of {totalEligible} eligible employees approved
</p>
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-slate-600">Approved</span>
        </div>
        <span className="font-semibold text-slate-900">
          {reviewStatus?.steps?.reduce((sum, s) => sum + s.approved_items, 0) || 0}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-slate-600">Pending</span>
        </div>
        <span className="font-semibold text-slate-900">
          {reviewStatus?.steps?.reduce((sum, s) => sum + s.pending_items, 0) || 0}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-slate-600">Rejected</span>
        </div>
        <span className="font-semibold text-slate-900">
          {reviewStatus?.steps?.reduce((sum, s) => sum + s.rejected_items, 0) || 0}
        </span>
      </div>
    </div>
  </CardContent>
</Card>

      {/* Payroll Totals */}
      <Card className="border-slate-200 shadow-none rounded-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Payroll Total
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Gross</span>
            <span className="font-semibold text-slate-900">
              KES {totalGross.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Deductions</span>
            <span className="font-semibold text-red-600">
              -KES {totalDeductions.toLocaleString()}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Net</span>
            <span className="font-bold text-slate-900">
              KES {totalNet.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Details */}
      <Card className="border-slate-200 shadow-none rounded-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Payroll Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <button
            type="button"
            onClick={() => navigate(`/company/${companyId}/payroll/${payrollRunId}/hub/allowances`)}
            className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-[#7F5EFD]/10 flex items-center justify-center">
                <Award className="h-4 w-4 text-[#7F5EFD]" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Allowances</p>
                <p className="text-xs text-slate-500">
                  KES {totalAllowances.toLocaleString()}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/company/${companyId}/payroll/${payrollRunId}/hub/deductions`)}
            className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-slate-100 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Deductions</p>
                <p className="text-xs text-slate-500">
                  KES {totalDeductions.toLocaleString()}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          {ineligibleCount > 0 && (
            <button
              type="button"
              onClick={() => navigate(`/company/${companyId}/payroll/${payrollRunId}/employees/excluded`)}
              className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-sm bg-amber-50 flex items-center justify-center">
                  <UserX className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Excluded Employees
                  </p>
                  <p className="text-xs text-slate-500">
                    {ineligibleCount} employees not in payroll
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(`/company/${companyId}/payroll/${payrollRunId}/employees/included`)}
            className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-slate-100 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Employee Details
                </p>
                <p className="text-xs text-slate-500">
                  {totalEmployees} employees
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </CardContent>
      </Card>

      {/* Reviewers */}
      {reviewers && reviewers.length > 0 && (
        <Card className="border-slate-200 shadow-none rounded-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Reviewers
              </CardTitle>
              <span className="text-xs text-slate-400">
                {reviewers.length} assigned
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewers.map((reviewer) => (
              <div key={reviewer.reviewer_id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {reviewer.reviewer_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Level {reviewer.reviewer_level}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {reviewer.approved_items}/{reviewer.total_items}
                  </span>
                </div>
                <Progress
                  value={reviewer.completion_percentage}
                  className="h-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </aside>
  );
}