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
  CircleCheck,
  Circle,
  Users,
  Calendar,
  Hash,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
//import { Progress } from "@/components/ui/progress";
import { API_BASE_URL } from "@/config";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

// Define proper interfaces
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

// Helper function to get status color (keep for progress bar)
const getStatusColor = (percentage: number): string => {
  if (percentage === 100) return "text-emerald-600";
  if (percentage >= 75) return "text-blue-600";
  if (percentage >= 50) return "text-amber-600";
  if (percentage >= 25) return "text-orange-600";
  return "text-rose-600";
};

// Helper function to get progress bar color (keep for progress bar)
const getProgressColor = (percentage: number): string => {
  if (percentage === 100) return "bg-emerald-500";
  if (percentage >= 75) return "bg-blue-500";
  if (percentage >= 50) return "bg-amber-500";
  if (percentage >= 25) return "bg-orange-500";
  return "bg-rose-500";
};

// Helper function to get progress bar background (keep for progress bar)
const getProgressBgColor = (percentage: number): string => {
  if (percentage === 100) return "bg-emerald-100";
  if (percentage >= 75) return "bg-blue-100";
  if (percentage >= 50) return "bg-amber-100";
  if (percentage >= 25) return "bg-orange-100";
  return "bg-rose-100";
};

// Helper function to get avatar background
const getAvatarColor = (percentage: number): string => {
  if (percentage === 100) return "bg-emerald-100 text-emerald-700";
  if (percentage >= 75) return "bg-blue-100 text-blue-700";
  if (percentage >= 50) return "bg-amber-100 text-amber-700";
  if (percentage >= 25) return "bg-orange-100 text-orange-700";
  if (percentage > 0) return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to format month display
const formatPayrollMonth = (month: string, year: number): string => {
  return `${month} ${year}`;
};

// Loading Skeleton Component
const ReviewStatusSkeleton = () => (
  <div className="space-y-6 max-w-6xl mx-auto p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
    
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-12 flex-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.steps) {
        setSteps(response.data.steps);
      } else {
        setSteps([]);
      }
      
      setPayrollInfo(response.data.payroll);
    } catch (error) {
      console.error("Failed to fetch review status:", error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error("Review status not found");
      } else {
        toast.error("Could not load review status");
      }
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

  const overallCompletion = steps.length > 0
    ? Math.round((totalStats.approved / totalStats.total) * 100)
    : 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="space-y-4 max-w-7xl mx-auto p-6">
          {/* Header with Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-sm border border-slate-300 shadow-none p-4">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-md hover:bg-slate-100"
                    onClick={() => navigate(`/company/${companyId}/payroll/history`)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Back to Payroll History</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    Review Pipeline
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{payrollInfo ? formatPayrollMonth(payrollInfo.payroll_month, payrollInfo.payroll_year) : 'Loading...'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <Hash className="h-3.5 w-3.5" />
                    <span>{payrollInfo?.payroll_number}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className="px-3 py-1 text-sm font-medium border-slate-300"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1 text-slate-500" />
                {overallCompletion}% Complete
              </Badge>
              
              <Button 
                className="bg-[#1F3A8A] hover:bg-[#162a63] cursor-pointer rounded-sm h-10 px-4 text-sm font-medium transition-all hover:-translate-y-0.5"
                onClick={() => navigate(`/company/${companyId}/payroll/${payrollRunId}/wizard`)}
              >
                Continue to Wizard 
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          {steps.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-slate-300 rounded-sm shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Total Reviewers</p>
                      <div className="text-3xl font-semibold text-slate-900">{steps.length}</div>
                    </div>
                    <div className="h-12 w-12 rounded-md bg-slate-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-300 rounded-sm shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Approved</p>
                      <div className="text-3xl font-semibold text-slate-900">{totalStats.approved}</div>
                    </div>
                    <div className="h-12 w-12 rounded-md bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-300 rounded-sm shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Pending</p>
                      <div className="text-3xl font-semibold text-slate-900">{totalStats.pending}</div>
                    </div>
                    <div className="h-12 w-12 rounded-md bg-amber-50 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-300 rounded-sm shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Rejected</p>
                      <div className="text-3xl font-semibold text-slate-900">{totalStats.rejected}</div>
                    </div>
                    <div className="h-12 w-12 rounded-md bg-rose-50 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-rose-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reviewers Table */}
          <Card className="  border border-slate-300 shadow-none rounded-sm px-2">
            <CardHeader className="border-b border-slate-300">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-slate-600" />
                </div>
                Approval Pipeline Reviewers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="hover:bg-transparent border-slate-200">
                    <TableHead className="w-24 font-medium text-slate-600">Level</TableHead>
                    <TableHead className="font-medium text-slate-600">Reviewer</TableHead>
                    <TableHead className="text-center font-medium text-slate-600">Progress</TableHead>
                    <TableHead className="text-center font-medium text-slate-600">Approved</TableHead>
                    <TableHead className="text-center font-medium text-slate-600">Pending</TableHead>
                    <TableHead className="text-center font-medium text-slate-600">Rejected</TableHead>
                    <TableHead className="text-right font-medium text-slate-600">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {steps.map((step) => (
                    <TableRow 
                      key={step.reviewer_id} 
                      className="hover:bg-slate-50/50 transition-colors border-slate-200"
                    >
                      {/* Level */}
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          {step.reviewer_level}
                        </div>
                      </TableCell>

                      {/* Reviewer */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-1 ring-slate-200">
                            <AvatarFallback className={cn("text-sm font-medium", getAvatarColor(step.completion_percentage))}>
                              {getInitials(step.reviewer_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">
                              {step.reviewer_name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <FileText className="h-3 w-3" />
                              {step.total_items} {step.total_items === 1 ? 'item' : 'items'} to review
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Progress Bar */}
                      <TableCell className="w-56">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className={cn("h-2 rounded-full", getProgressBgColor(step.completion_percentage))}>
                              <div 
                                className={cn("h-2 rounded-full transition-all duration-500", getProgressColor(step.completion_percentage))}
                                style={{ width: `${step.completion_percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className={cn(
                            "text-sm font-medium min-w-11.25",
                            getStatusColor(step.completion_percentage)
                          )}>
                            {step.completion_percentage}%
                          </span>
                        </div>
                      </TableCell>

                      {/* Approved Count */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-3 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          {step.approved_items}
                        </Badge>
                      </TableCell>

                      {/* Pending Count */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium px-3 py-1">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {step.pending_items}
                        </Badge>
                      </TableCell>

                      {/* Rejected Count */}
                      <TableCell className="text-center">
                        {step.rejected_items > 0 ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-medium px-3 py-1">
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            {step.rejected_items}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Status Indicator */}
                      <TableCell className="text-right">
                        {step.completion_percentage === 100 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 font-medium px-3 py-1">
                            <CircleCheck className="h-3.5 w-3.5 mr-1" />
                            Complete
                          </Badge>
                        ) : step.completion_percentage > 0 ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 font-medium px-3 py-1">
                            <CircleDot className="h-3.5 w-3.5 mr-1" />
                            In Progress
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 border-slate-200 font-medium px-3 py-1">
                            <Circle className="h-3.5 w-3.5 mr-1" />
                            Not Started
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {steps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-20 w-20 rounded-sm bg-slate-100 flex items-center justify-center">
                            <ShieldCheck className="h-10 w-10 text-slate-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-slate-700">No Reviewers Configured</p>
                            <p className="text-sm text-slate-500 max-w-md">
                              This payroll run doesn't have any reviewers assigned yet. Configure reviewers to start the approval process.
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="lg"
                            className="mt-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => navigate(`/company/${companyId}/settings/reviewers`)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Configure Reviewers
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          {steps.length > 0 && (
            <Card className="border border-slate-300 rounded-sm shadow-none bg-slate-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Info className="h-4 w-4 text-slate-500" />
                    <span>Reviewers are processed in order of their level (lowest to highest)</span>
                  </div>
                  <Badge variant="outline" className="border-slate-200">
                    {steps.filter(s => s.completion_percentage === 100).length} of {steps.length} steps complete
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}