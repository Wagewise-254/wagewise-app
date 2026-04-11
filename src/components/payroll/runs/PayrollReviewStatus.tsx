import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronRight,
  ShieldCheck,
  CircleDot,
  Circle,
  Users,
  Calendar,
  Hash,
  Info,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface PayrollInfo {
  payroll_month: string;
  payroll_year: number;
  payroll_number: string;
  status: string;
}

interface ReviewStep {
  reviewer_id: string;
  reviewer_name: string;
  reviewer_level: number;
  total_items: number;
  approved_items: number;
  pending_items: number;
  rejected_items: number;
  completion_percentage: number;
}

interface ReviewStatusResponse {
  payroll: PayrollInfo;
  steps: ReviewStep[];
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatPayrollMonth = (month: string, year: number): string => {
  return `${month} ${year}`;
};

const getStatusBadge = (percentage: number) => {
  if (percentage === 100) {
    return { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 };
  }
  if (percentage > 0) {
    return { label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CircleDot };
  }
  return { label: "Pending", color: "bg-slate-50 text-slate-600 border-slate-200", icon: Circle };
};

const ReviewStatusSkeleton = () => (
  <div className="min-h-screen bg-slate-50">
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-12 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default function PayrollReviewStatus() {
  const { companyId, payrollRunId } = useParams<{ companyId: string; payrollRunId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<ReviewStep[]>([]);
  const [payrollInfo, setPayrollInfo] = useState<PayrollInfo | null>(null);
  const session = useAuthStore((state) => state.session);

  const fetchReviewStatus = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    if (!companyId || !payrollRunId) {
      toast.error("Invalid company or payroll ID");
      navigate(`/company/${companyId}/payroll/history`);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get<ReviewStatusResponse>(
        `${API_BASE_URL}/company/${companyId}/payroll/runs/${payrollRunId}/review-summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSteps(response.data?.steps || []);
      setPayrollInfo(response.data?.payroll || null);
    } catch (error) {
      console.error("Failed to fetch review status:", error);
      toast.error("Could not load review status");
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, payrollRunId, session?.access_token, navigate]);

  useEffect(() => {
    fetchReviewStatus();
  }, [fetchReviewStatus]);

  if (loading) return <ReviewStatusSkeleton />;

  const totalStats = steps.reduce(
    (acc, step) => ({
      approved: acc.approved + step.approved_items,
      pending: acc.pending + step.pending_items,
      rejected: acc.rejected + step.rejected_items,
      total: acc.total + step.total_items,
    }),
    { approved: 0, pending: 0, rejected: 0, total: 0 }
  );

  const allApproved = steps.length > 0 && steps.every(step => step.completion_percentage === 100);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-md hover:bg-slate-100"
                    onClick={() => navigate(`/company/${companyId}/payroll/history`)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to Payroll History</TooltipContent>
              </Tooltip>
              
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Review Status</h1>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{payrollInfo ? formatPayrollMonth(payrollInfo.payroll_month, payrollInfo.payroll_year) : '—'}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <Hash className="h-3.5 w-3.5" />
                  <span>{payrollInfo?.payroll_number || '—'}</span>
                </div>
              </div>
            </div>

            <Button 
              className="bg-[#1F3A8A] hover:bg-[#162a63] cursor-pointer rounded-md h-9 px-4 text-sm font-medium"
              onClick={() => navigate(`/company/${companyId}/payroll/${payrollRunId}/wizard`)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {allApproved ? "Prepare Payroll" : "Continue Preparation"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Simple Stats Bar */}
          {steps.length > 0 && (
            <div className="flex items-center gap-6 mb-6 p-4 bg-white rounded-md border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">{steps.length} Reviewer{steps.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-slate-600">{totalStats.approved} Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-slate-600">{totalStats.pending} Pending</span>
              </div>
              {totalStats.rejected > 0 && (
                <>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-500" />
                    <span className="text-sm text-rose-600">{totalStats.rejected} Rejected</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Reviewers List - Simple Card */}
          <Card className="border border-slate-200 shadow-sm rounded-md">
            <CardContent className="p-0">
              {steps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">No Reviewers Assigned</p>
                  <p className="text-xs text-slate-400 mt-1">Configure reviewers in company settings</p>
                  <Button 
                    variant="link" 
                    size="sm"
                    className="mt-3 text-[#1F3A8A]"
                    onClick={() => navigate(`/company/${companyId}/settings/reviewers`)}
                  >
                    Configure Reviewers
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {steps.map((step) => {
                    const StatusIcon = getStatusBadge(step.completion_percentage).icon;
                    return (
                      <div key={step.reviewer_id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-100 text-slate-600 text-sm font-medium">
                            {step.reviewer_level}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                              {getInitials(step.reviewer_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{step.reviewer_name}</p>
                            <p className="text-xs text-slate-400">
                              {step.approved_items} of {step.total_items} reviewed
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* Mini progress bar */}
                          <div className="w-24">
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  step.completion_percentage === 100 ? "bg-emerald-500" : "bg-blue-500"
                                )}
                                style={{ width: `${step.completion_percentage}%` }}
                              />
                            </div>
                          </div>
                          
                          <Badge 
                            variant="outline" 
                            className={cn("px-2 py-0.5 text-xs font-normal", getStatusBadge(step.completion_percentage).color)}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {getStatusBadge(step.completion_percentage).label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simple Info Note */}
          {steps.length > 0 && !allApproved && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 justify-center">
              <Info className="h-3 w-3" />
              <span>All reviewers must approve before payroll can be processed</span>
            </div>
          )}

          {/* Success Message when all approved */}
          {allApproved && steps.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-50 py-2 px-4 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
              <span>All reviews complete! You can now prepare the payroll.</span>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}