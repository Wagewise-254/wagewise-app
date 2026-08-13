import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Award,
  Receipt,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PayrollDetail, ReviewStatus } from "../types";

interface EmployeeSheetProps {
  employee: PayrollDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateReview: (reviewId: string, status: ReviewStatus) => void;
  isUpdating: boolean;
  isApproved: boolean;
}

const statusColors: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export function EmployeeSheet({
  employee,
  isOpen,
  onClose,
  onUpdateReview,
  isUpdating,
  isApproved,
}: EmployeeSheetProps) {
  if (!employee) return null;

  const reviewStatus = employee.my_review?.status || "PENDING";
  const reviewId = employee.my_review?.id;

  const totalAllowances =
    employee.allowances_details?.reduce((sum, a) => sum + a.value, 0) || 0;

  const totalDeductions =
    employee.deductions_details?.reduce((sum, d) => sum + d.value, 0) || 0;

  const handleApprove = () => {
    if (reviewId) {
      onUpdateReview(reviewId, "APPROVED");
    }
  };

  const handleReject = () => {
    if (reviewId) {
      onUpdateReview(reviewId, "REJECTED");
    }
  };

  const handleRevert = () => {
    if (reviewId) {
      onUpdateReview(reviewId, "PENDING");
    }
  };

  const canReview = reviewStatus === "PENDING" && !isApproved;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <SheetTitle className="text-xl">
              {employee.employee_name || "Unknown Employee"}
            </SheetTitle>
            <Badge
              variant="outline"
              className={cn(
                statusColors[reviewStatus] || "bg-slate-50 text-slate-700",
                "border capitalize rounded-sm",
              )}
            >
              {reviewStatus.toLowerCase()}
            </Badge>
          </div>
          <SheetDescription>
            {employee.employee_number} · {employee.job_title || "N/A"}
            {employee.department_name && ` · ${employee.department_name}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Payroll summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 border border-slate-100 rounded-sm p-3">
              <p className="text-xs text-slate-500">Basic</p>
              <p className="font-semibold text-slate-900 mt-1">
                KES {employee.basic_salary?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-sm p-3">
              <p className="text-xs text-slate-500">Gross</p>
              <p className="font-semibold text-slate-900 mt-1">
                KES {employee.gross_pay?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-sm p-3">
              <p className="text-xs text-emerald-700">Net</p>
              <p className="font-semibold text-emerald-700 mt-1">
                KES {employee.net_pay?.toLocaleString() || "0"}
              </p>
            </div>
          </div>
          {!employee.is_eligible && (
            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">Ineligible</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {employee.ineligibility_reason ||
                    "Employee is not eligible for this payroll"}
                </p>
              </div>
            </div>
          )}
          {reviewStatus === "PENDING" && !isApproved && (
            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Requires review
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Verify payroll details before approving
                </p>
              </div>
            </div>
          )}
          <Tabs defaultValue="allowances" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-sm">
              <TabsTrigger value="allowances" className="rounded-sm text-xs">
                <Award className="h-3.5 w-3.5 mr-1.5" />
                Allowances
              </TabsTrigger>
              <TabsTrigger value="deductions" className="rounded-sm text-xs">
                <Receipt className="h-3.5 w-3.5 mr-1.5" />
                Deductions
              </TabsTrigger>
              <TabsTrigger value="payment" className="rounded-sm text-xs">
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="allowances" className="mt-3">
              <div className="space-y-2">
                {employee.allowances_details?.map((allowance, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-sm hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex flex-col">
                      <p className="font-medium text-sm text-slate-900">
                        {allowance.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 border-0"
                        >
                          {allowance.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 border-0"
                        >
                          {allowance.is_taxable ? "Taxable" : "Non-taxable"}
                        </Badge>
                        {allowance.code && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 border-0"
                          >
                            {allowance.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="font-medium text-sm text-emerald-600">
                      +KES {allowance.value.toLocaleString()}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2.5 bg-[#7F5EFD]/5 rounded-sm border border-[#7F5EFD]/20">
                  <p className="font-semibold text-sm text-slate-900">
                    Total Allowances
                  </p>
                  <p className="font-bold text-[#7F5EFD]">
                    +KES {totalAllowances.toLocaleString()}
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="deductions" className="mt-3">
              <div className="space-y-2">
                {employee.deductions_details?.map((deduction, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-sm hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex flex-col">
                      <p className="font-medium text-sm text-slate-900">
                        {deduction.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 border-0"
                        >
                          {deduction.is_pre_tax ? "Pre-tax" : "Post-tax"}
                        </Badge>
                        {deduction.code && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 border-0"
                          >
                            {deduction.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="font-medium text-sm text-red-600">
                      -KES {deduction.value.toLocaleString()}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2.5 bg-red-50/50 rounded-sm border border-red-200">
                  <p className="font-semibold text-sm text-slate-900">
                    Total Deductions
                  </p>
                  <p className="font-bold text-red-600">
                    -KES {totalDeductions.toLocaleString()}
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="payment" className="mt-3">
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm">
                  <p className="text-xs text-slate-500">Payment Method</p>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {employee.payment_method || "Not set"}
                  </p>
                </div>
                {employee.bank_name && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm">
                    <p className="text-xs text-slate-500">Bank</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {employee.bank_name}
                      {employee.branch_name && ` - ${employee.branch_name}`}
                    </p>
                  </div>
                )}
                {employee.account_name && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm">
                    <p className="text-xs text-slate-500">Account</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {employee.account_name}
                      {employee.account_number &&
                        ` (${employee.account_number})`}
                    </p>
                  </div>
                )}
                {employee.mobile_phone && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-sm">
                    <p className="text-xs text-slate-500">Mobile</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {employee.mobile_phone}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <Separator />
          {canReview ? (
            <div className="space-y-2">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm"
                onClick={handleApprove}
                disabled={isUpdating}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isUpdating ? "Updating..." : "Approve Employee"}
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-sm"
                onClick={handleReject}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isUpdating ? "Updating..." : "Reject / Request Changes"}
              </Button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-center">
              <p className="text-sm text-slate-500">
                {isApproved
                  ? "This payroll has been approved and cannot be modified"
                  : reviewStatus === "APPROVED"
                    ? "Employee has been approved"
                    : reviewStatus === "REJECTED"
                      ? "Employee has been rejected"
                      : "Review already completed"}
              </p>
            </div>
          )}

          {(reviewStatus === "APPROVED" || reviewStatus === "REJECTED")  && (
            <Button
              variant="outline"
              className="w-full border-amber-200 text-amber-600 hover:bg-amber-50 rounded-sm"
              onClick={handleRevert}
              disabled={isUpdating || isApproved}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isUpdating ? "Updating..." : "Revert to Pending"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
