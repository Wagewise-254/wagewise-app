// src/pages/company/payroll/PayrollHubPage.tsx

import {
  Users,
  Receipt,
  FileText,
  ChevronRight,
  Lock,
  CheckCircle2,
  Clock3,
  AlertCircle,
  WalletCards,
  Calculator,
  SlidersHorizontal,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Mock payroll data
// -----------------------------------------------------------------------------

const payrollSummary = {
  id: "PR-202604-001",
  period: "April 2026",
  status: "approved" as "draft" | "under_review" | "approved" | "locked",

  employees: 45,
  gross: 3847500,
  deductions: 784200,
  allowances: 892500,
  net: 3063300,

  review: {
    reviewers: 3,
    completed: 3,
    reviewedBy: "James Kariuki",
    approvedBy: "Sarah Johnson",
    approvedDate: "25 Apr 2026",
  },

  payslips: {
    total: 45,
    generated: 45,
    sent: 41,
    viewed: 36,
  },

  reports: {
    ready: 8,
    total: 8,
  },

  payment: {
    status: "Scheduled",
    date: "28 Apr 2026",
  },
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

const payrollStatus = {
  draft: {
    label: "Draft",
    icon: AlertCircle,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },

  under_review: {
    label: "Under Review",
    icon: Clock3,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },

  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  locked: {
    label: "Locked",
    icon: Lock,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

// -----------------------------------------------------------------------------
// Reusable components
// -----------------------------------------------------------------------------

function SectionLink({
  icon: Icon,
  title,
  description,
  href = "#",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 border border-slate-200 p-4 rounded-sm hover:border-slate-300 hover:bg-slate-50/60 transition-colors"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-200 bg-white rounded-sm">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{title}</p>

        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>

      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function PayrollHubPage() {
  const status = payrollStatus[payrollSummary.status];
  const StatusIcon = status.icon;

  const payslipSentPercentage = Math.round(
    (payrollSummary.payslips.sent / payrollSummary.payslips.total) * 100,
  );

  const payslipViewedPercentage = Math.round(
    (payrollSummary.payslips.viewed / payrollSummary.payslips.total) * 100,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Payroll Hub
            </h1>

            <Badge
              variant="outline"
              className={cn(
                "rounded-sm px-2 py-0.5 text-xs font-medium",
                status.className,
              )}
            >
              <StatusIcon className="mr-1.5 h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
            <span>{payrollSummary.id}</span>
            <span className="text-slate-300">•</span>
            <span>{payrollSummary.period}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {payrollSummary.status === "approved" && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm border-slate-200"
            >
              <Lock className="mr-2 h-3.5 w-3.5" />
              Lock Payroll
            </Button>
          )}

          {payrollSummary.status === "locked" && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm border-slate-200"
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Revert to Review
            </Button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Payroll Overview                                                    */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-4">
        <div className="bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Employees</p>

          <p className="mt-1 text-xl font-semibold text-slate-900">
            {payrollSummary.employees}
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Gross Payroll</p>

          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(payrollSummary.gross)}
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Deductions</p>

          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(payrollSummary.deductions)}
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Net Payroll</p>

          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(payrollSummary.net)}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main Grid                                                           */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---------------------------------------------------------------- */}
        {/* Left                                                              */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-5">
          {/* Review & Approval */}

          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Review & Approval
                  </CardTitle>

                  <p className="mt-1 text-xs text-slate-500">
                    Payroll approval workflow
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={cn("rounded-sm text-[11px]", status.className)}
                >
                  {status.label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-slate-200 bg-slate-50">
                    <CheckCircle2 className="h-4 w-4 text-slate-600" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {payrollSummary.review.completed} of{" "}
                      {payrollSummary.review.reviewers} reviewers completed
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {payrollSummary.status === "under_review"
                        ? "Payroll is awaiting approval."
                        : "Review process completed."}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-sm border-slate-200"
                >
                  Review Payroll
                  <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Approved By</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {payrollSummary.review.approvedBy}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Approved On</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {payrollSummary.review.approvedDate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Data */}

          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payroll Data
              </CardTitle>

              <p className="text-xs text-slate-500">
                Manage the data used for this payroll run.
              </p>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SectionLink
                  icon={Users}
                  title="Employees"
                  description={`${payrollSummary.employees} employees included`}
                  href="/company/employees"
                />

                <SectionLink
                  icon={Calculator}
                  title="Allowances"
                  description="Review payroll allowances"
                  href="/company/payroll/allowances"
                />

                <SectionLink
                  icon={SlidersHorizontal}
                  title="Deductions"
                  description="Review payroll deductions"
                  href="/company/payroll/deductions"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payslips */}

          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Payslips
                  </CardTitle>

                  <p className="mt-1 text-xs text-slate-500">
                    Distribution overview for this payroll.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-sm px-2 text-xs text-slate-600"
                >
                  View Payslips
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Generated</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {payrollSummary.payslips.generated}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    of {payrollSummary.payslips.total}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Sent</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {payrollSummary.payslips.sent}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {payslipSentPercentage}% distributed
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Viewed</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {payrollSummary.payslips.viewed}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {payslipViewedPercentage}% viewed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports */}

          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Reports
                  </CardTitle>

                  <p className="mt-1 text-xs text-slate-500">
                    Payroll and statutory reporting.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-sm px-2 text-xs text-slate-600"
                >
                  View Reports
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between border border-slate-200 bg-slate-50/50 p-3 rounded-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 bg-white">
                    <FileText className="h-4 w-4 text-slate-600" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Reports Ready
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {payrollSummary.reports.total} payroll and statutory
                      reports available
                    </p>
                  </div>
                </div>

                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right                                                             */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-5">
          {/* Payroll State */}

          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payroll Status
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div
                className={cn(
                  "flex items-start gap-3 border p-3 rounded-sm",
                  status.className,
                )}
              >
                <StatusIcon className="mt-0.5 h-4 w-4 shrink-0" />

                <div>
                  <p className="text-sm font-medium">{status.label}</p>

                  <p className="mt-1 text-xs opacity-80">
                    {payrollSummary.status === "draft" &&
                      "Payroll is being prepared."}

                    {payrollSummary.status === "under_review" &&
                      "Payroll is currently awaiting reviewer approval."}

                    {payrollSummary.status === "approved" &&
                      "Payroll has been approved and is ready to be locked."}

                    {payrollSummary.status === "locked" &&
                      "Payroll is locked and cannot be modified."}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Payroll ID</span>

                  <span className="font-medium text-slate-900">
                    {payrollSummary.id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pay Period</span>

                  <span className="font-medium text-slate-900">
                    {payrollSummary.period}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Employees</span>

                  <span className="font-medium text-slate-900">
                    {payrollSummary.employees}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payment Methods
              </CardTitle>

              <p className="mt-1 text-xs text-slate-500">
                Payment accounts configured for payroll.
              </p>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 bg-slate-50">
                    <WalletCards className="h-4 w-4 text-slate-600" />
                  </div>

                  <div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Configured for payroll payments
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-sm px-2 text-xs text-slate-600"
                >
                  View
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* More */}

          <Card className="rounded-sm border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payroll Management
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <SectionLink
                icon={Receipt}
                title="Payslip Management"
                description="Generate and distribute payslips"
                href="/company/payroll/payslips"
              />

              <SectionLink
                icon={FileText}
                title="Payroll Reports"
                description="View and export payroll reports"
                href="/company/payroll/reports"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
