// src/pages/company/payroll/PayrollReviewPage.tsx

import { useState } from "react";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  Search,
  Download,
  Send,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Receipt,
  Award,
  UserCheck,
  UserX,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// -----------------------------------------------------------------------------
// Mock data
// -----------------------------------------------------------------------------

const mockReviewers = [
  {
    id: "rev1",
    name: "Sarah Johnson",
    level: 1,
    approved: 12,
    total: 15,
    status: "in-progress",
  },
  {
    id: "rev2",
    name: "Michael Chen",
    level: 2,
    approved: 8,
    total: 15,
    status: "pending",
  },
  {
    id: "rev3",
    name: "Amina Okafor",
    level: 3,
    approved: 0,
    total: 15,
    status: "not-started",
  },
];

const mockEmployees = [
  {
    id: "emp1",
    name: "John Mwangi",
    employeeNumber: "EMP-001",
    department: "Engineering",
    jobTitle: "Senior Developer",
    basicSalary: 85000,
    grossPay: 97500,
    netPay: 72340,
    status: "approved",
    allowances: [
      { name: "Housing Allowance", value: 15000, type: "cash", taxable: true },
      { name: "Transport Allowance", value: 5000, type: "cash", taxable: true },
      { name: "Meal Allowance", value: 3000, type: "cash", taxable: false },
    ],
    deductions: [
      { name: "PAYE", value: 15420, type: "statutory" },
      { name: "NSSF", value: 1080, type: "statutory" },
      { name: "SHIF", value: 2681, type: "statutory" },
      { name: "Housing Levy", value: 1463, type: "statutory" },
      { name: "Staff Loan", value: 5000, type: "other" },
    ],
    paymentMethod: "Bank Transfer",
    bankDetails: {
      bank: "KCB Bank",
      account: "1234567890",
      branch: "Nairobi",
    },
  },
  {
    id: "emp2",
    name: "Grace Wanjiku",
    employeeNumber: "EMP-002",
    department: "Marketing",
    jobTitle: "Marketing Manager",
    basicSalary: 95000,
    grossPay: 110000,
    netPay: 81200,
    status: "pending",
    allowances: [
      { name: "Housing Allowance", value: 18000, type: "cash", taxable: true },
      { name: "Communication Allowance", value: 8000, type: "cash", taxable: true },
      { name: "Car Allowance", value: 12000, type: "non-cash", taxable: true },
    ],
    deductions: [
      { name: "PAYE", value: 18200, type: "statutory" },
      { name: "NSSF", value: 1080, type: "statutory" },
      { name: "SHIF", value: 3025, type: "statutory" },
      { name: "Housing Levy", value: 1650, type: "statutory" },
      { name: "HELB", value: 4500, type: "statutory" },
      { name: "Insurance", value: 2500, type: "other" },
    ],
    paymentMethod: "M-Pesa",
    bankDetails: {
      bank: "Safaricom",
      account: "254712345678",
      branch: "M-Pesa",
    },
  },
  {
    id: "emp3",
    name: "David Ochieng",
    employeeNumber: "EMP-003",
    department: "Finance",
    jobTitle: "Accountant",
    basicSalary: 70000,
    grossPay: 82500,
    netPay: 61200,
    status: "rejected",
    allowances: [
      { name: "Housing Allowance", value: 12000, type: "cash", taxable: true },
      { name: "Professional Allowance", value: 5000, type: "cash", taxable: true },
    ],
    deductions: [
      { name: "PAYE", value: 13200, type: "statutory" },
      { name: "NSSF", value: 1080, type: "statutory" },
      { name: "SHIF", value: 2269, type: "statutory" },
      { name: "Housing Levy", value: 1238, type: "statutory" },
      { name: "Staff Loan", value: 3000, type: "other" },
    ],
    paymentMethod: "Bank Transfer",
    bankDetails: {
      bank: "Equity Bank",
      account: "9876543210",
      branch: "Westlands",
    },
  },
  {
    id: "emp4",
    name: "Susan Akinyi",
    employeeNumber: "EMP-004",
    department: "HR",
    jobTitle: "HR Coordinator",
    basicSalary: 65000,
    grossPay: 72000,
    netPay: 53800,
    status: "pending",
    allowances: [
      { name: "Housing Allowance", value: 10000, type: "cash", taxable: true },
      { name: "Transport Allowance", value: 4000, type: "cash", taxable: true },
    ],
    deductions: [
      { name: "PAYE", value: 11200, type: "statutory" },
      { name: "NSSF", value: 1080, type: "statutory" },
      { name: "SHIF", value: 1980, type: "statutory" },
      { name: "Housing Levy", value: 1080, type: "statutory" },
      { name: "Sacco", value: 2000, type: "other" },
    ],
    paymentMethod: "Bank Transfer",
    bankDetails: {
      bank: "Cooperative Bank",
      account: "5555555555",
      branch: "Town",
    },
  },
  {
    id: "emp5",
    name: "Peter Kamau",
    employeeNumber: "EMP-005",
    department: "Engineering",
    jobTitle: "DevOps Engineer",
    basicSalary: 90000,
    grossPay: 105000,
    netPay: 77500,
    status: "approved",
    allowances: [
      { name: "Housing Allowance", value: 16000, type: "cash", taxable: true },
      { name: "Internet Allowance", value: 7000, type: "cash", taxable: true },
      { name: "Certification Allowance", value: 5000, type: "cash", taxable: false },
    ],
    deductions: [
      { name: "PAYE", value: 16200, type: "statutory" },
      { name: "NSSF", value: 1080, type: "statutory" },
      { name: "SHIF", value: 2888, type: "statutory" },
      { name: "Housing Levy", value: 1575, type: "statutory" },
    ],
    paymentMethod: "Bank Transfer",
    bankDetails: {
      bank: "Standard Chartered",
      account: "4444444444",
      branch: "Upper Hill",
    },
  },
];

type StatusType = "approved" | "pending" | "rejected";

const statusColors: Record<StatusType, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const statusIcons: Record<StatusType, React.ReactNode> = {
  approved: <CheckCircle2 className="h-3.5 w-3.5" />,
  pending: <Clock className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
};

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function PayrollReviewPage() {
  const [selectedEmployee, setSelectedEmployee] =
    useState<typeof mockEmployees[0] | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalEmployees = mockEmployees.length;

  const approvedCount = mockEmployees.filter(
    (e) => e.status === "approved"
  ).length;

  const pendingCount = mockEmployees.filter(
    (e) => e.status === "pending"
  ).length;

  const rejectedCount = mockEmployees.filter(
    (e) => e.status === "rejected"
  ).length;

  const totalGross = mockEmployees.reduce(
    (sum, e) => sum + e.grossPay,
    0
  );

  const totalNet = mockEmployees.reduce(
    (sum, e) => sum + e.netPay,
    0
  );

  const completionPercentage = Math.round(
    (approvedCount / totalEmployees) * 100
  );

  const totalAllowances = mockEmployees.reduce(
    (sum, employee) =>
      sum +
      employee.allowances.reduce(
        (allowanceSum, allowance) => allowanceSum + allowance.value,
        0
      ),
    0
  );

  const totalDeductions = mockEmployees.reduce(
    (sum, employee) =>
      sum +
      employee.deductions.reduce(
        (deductionSum, deduction) => deductionSum + deduction.value,
        0
      ),
    0
  );

  const filteredEmployees = mockEmployees.filter((employee) => {
    const matchesStatus =
      filterStatus === "all" || employee.status === filterStatus;

    const query = searchQuery.toLowerCase();

    const matchesSearch =
      employee.name.toLowerCase().includes(query) ||
      employee.employeeNumber.toLowerCase().includes(query) ||
      employee.jobTitle.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: totalEmployees,
    approved: approvedCount,
    pending: pendingCount,
    rejected: rejectedCount,
  };

  return (
    <div className="max-w-375 mx-auto py-6 px-4">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Review & Approve
            </h1>

            <Badge className="bg-[#7F5EFD] text-white border-0 rounded-sm">
              Under Review
            </Badge>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            PR-202604-001 · April 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm border-slate-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-sm border-slate-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>


      {/* ------------------------------------------------------------------ */}
      {/* Main layout                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_290px] gap-5">
        {/* ---------------------------------------------------------------- */}
        {/* Employee workspace                                               */}
        {/* ---------------------------------------------------------------- */}

        <div className="min-w-0">
          {/* Filters */}

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-sm border-slate-200 h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />

              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-36 rounded-sm border-slate-200 h-10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All ({statusCounts.all})
                  </SelectItem>

                  <SelectItem value="approved">
                    Approved ({statusCounts.approved})
                  </SelectItem>

                  <SelectItem value="pending">
                    Pending ({statusCounts.pending})
                  </SelectItem>

                  <SelectItem value="rejected">
                    Rejected ({statusCounts.rejected})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}

          <Card className="border-slate-200 shadow-none rounded-sm overflow-hidden">
            <CardHeader className="px-5 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Employees
                  </CardTitle>

                  <p className="text-xs text-slate-500 mt-1">
                    Review employee payroll before approving the run.
                  </p>
                </div>

                <span className="text-xs text-slate-500">
                  {filteredEmployees.length} of {totalEmployees}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-slate-50 border-slate-200">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider pl-5">
                      Employee
                    </TableHead>

                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                      Gross Pay
                    </TableHead>

                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                      Deductions
                    </TableHead>

                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                      Net Pay
                    </TableHead>

                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </TableHead>

                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right pr-5">
                      Review
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const deductionTotal = employee.deductions.reduce(
                      (sum, deduction) => sum + deduction.value,
                      0
                    );

                    return (
                      <TableRow
                        key={employee.id}
                        className="hover:bg-slate-50/70 border-slate-100"
                      >
                        <TableCell className="pl-5 py-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {employee.name}
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5">
                              {employee.employeeNumber} ·{" "}
                              {employee.jobTitle}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="font-medium text-slate-900">
                            KES {employee.grossPay.toLocaleString()}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div>
                            <p className="font-medium text-slate-700">
                              KES {deductionTotal.toLocaleString()}
                            </p>

                            <p className="text-xs text-slate-400">
                              {employee.deductions.length} deductions
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="font-semibold text-slate-900">
                            KES {employee.netPay.toLocaleString()}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${statusColors[
                              employee.status as StatusType
                            ]} border capitalize flex items-center gap-1.5 w-fit rounded-sm`}
                          >
                            {statusIcons[employee.status as StatusType]}
                            {employee.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-5">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#7F5EFD] hover:text-[#6b4de0] hover:bg-[#7F5EFD]/10 rounded-sm"
                                onClick={() =>
                                  setSelectedEmployee(employee)
                                }
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                Review
                              </Button>
                            </SheetTrigger>

                            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                              <SheetHeader>
                                <div className="flex items-center gap-3">
                                  <SheetTitle className="text-xl">
                                    {selectedEmployee?.name}
                                  </SheetTitle>

                                  {selectedEmployee && (
                                    <Badge
                                      variant="outline"
                                      className={`${statusColors[
                                        selectedEmployee.status as StatusType
                                      ]} border capitalize rounded-sm`}
                                    >
                                      {
                                        selectedEmployee.status
                                      }
                                    </Badge>
                                  )}
                                </div>

                                <SheetDescription>
                                  {selectedEmployee?.employeeNumber} ·{" "}
                                  {selectedEmployee?.jobTitle}
                                </SheetDescription>
                              </SheetHeader>

                              {selectedEmployee && (
                                <div className="mt-6 space-y-6">
                                  {/* Payroll summary */}

                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-slate-50 border border-slate-100 rounded-sm p-3">
                                      <p className="text-xs text-slate-500">
                                        Basic Salary
                                      </p>

                                      <p className="font-semibold text-slate-900 mt-1">
                                        KES{" "}
                                        {selectedEmployee.basicSalary.toLocaleString()}
                                      </p>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-100 rounded-sm p-3">
                                      <p className="text-xs text-slate-500">
                                        Gross Pay
                                      </p>

                                      <p className="font-semibold text-slate-900 mt-1">
                                        KES{" "}
                                        {selectedEmployee.grossPay.toLocaleString()}
                                      </p>
                                    </div>

                                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-sm p-3">
                                      <p className="text-xs text-emerald-700">
                                        Net Pay
                                      </p>

                                      <p className="font-semibold text-emerald-700 mt-1">
                                        KES{" "}
                                        {selectedEmployee.netPay.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Review alert */}

                                  {selectedEmployee.status ===
                                    "pending" && (
                                    <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-sm">
                                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />

                                      <div>
                                        <p className="text-sm font-medium text-amber-900">
                                          Employee requires review
                                        </p>

                                        <p className="text-xs text-amber-700 mt-0.5">
                                          Verify payroll details before
                                          approving this employee.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Detail tabs */}

                                  <Tabs
                                    defaultValue="allowances"
                                    className="w-full"
                                  >
                                    <TabsList className="grid w-full grid-cols-3 rounded-sm">
                                      <TabsTrigger
                                        value="allowances"
                                        className="rounded-sm"
                                      >
                                        <Award className="h-4 w-4 mr-2" />
                                        Allowances
                                      </TabsTrigger>

                                      <TabsTrigger
                                        value="deductions"
                                        className="rounded-sm"
                                      >
                                        <Receipt className="h-4 w-4 mr-2" />
                                        Deductions
                                      </TabsTrigger>

                                      <TabsTrigger
                                        value="payment"
                                        className="rounded-sm"
                                      >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Payment
                                      </TabsTrigger>
                                    </TabsList>

                                    <TabsContent
                                      value="allowances"
                                      className="mt-4"
                                    >
                                      <div className="space-y-2">
                                        {selectedEmployee.allowances.map(
                                          (allowance, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm"
                                            >
                                              <div>
                                                <p className="font-medium text-sm text-slate-900">
                                                  {allowance.name}
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                  {allowance.type} ·{" "}
                                                  {allowance.taxable
                                                    ? "Taxable"
                                                    : "Non-taxable"}
                                                </p>
                                              </div>

                                              <p className="font-medium text-sm text-slate-900">
                                                KES{" "}
                                                {allowance.value.toLocaleString()}
                                              </p>
                                            </div>
                                          )
                                        )}

                                        <div className="flex items-center justify-between p-3 bg-[#7F5EFD]/5 rounded-sm border border-[#7F5EFD]/20">
                                          <p className="font-semibold text-sm text-slate-900">
                                            Total Allowances
                                          </p>

                                          <p className="font-bold text-[#7F5EFD]">
                                            KES{" "}
                                            {selectedEmployee.allowances
                                              .reduce(
                                                (sum, allowance) =>
                                                  sum + allowance.value,
                                                0
                                              )
                                              .toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    </TabsContent>

                                    <TabsContent
                                      value="deductions"
                                      className="mt-4"
                                    >
                                      <div className="space-y-2">
                                        {selectedEmployee.deductions.map(
                                          (deduction, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm"
                                            >
                                              <div>
                                                <p className="font-medium text-sm text-slate-900">
                                                  {deduction.name}
                                                </p>

                                                <p className="text-xs text-slate-500 capitalize">
                                                  {deduction.type}
                                                </p>
                                              </div>

                                              <p className="font-medium text-sm text-red-600">
                                                -KES{" "}
                                                {deduction.value.toLocaleString()}
                                              </p>
                                            </div>
                                          )
                                        )}

                                        <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-sm border border-red-200">
                                          <p className="font-semibold text-sm text-slate-900">
                                            Total Deductions
                                          </p>

                                          <p className="font-bold text-red-600">
                                            -KES{" "}
                                            {selectedEmployee.deductions
                                              .reduce(
                                                (sum, deduction) =>
                                                  sum + deduction.value,
                                                0
                                              )
                                              .toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    </TabsContent>

                                    <TabsContent
                                      value="payment"
                                      className="mt-4"
                                    >
                                      <div className="space-y-2">
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
                                          <p className="text-xs text-slate-500">
                                            Payment Method
                                          </p>

                                          <p className="font-medium text-slate-900 mt-1">
                                            {
                                              selectedEmployee.paymentMethod
                                            }
                                          </p>
                                        </div>

                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
                                          <p className="text-xs text-slate-500">
                                            Bank
                                          </p>

                                          <p className="font-medium text-slate-900 mt-1">
                                            {
                                              selectedEmployee.bankDetails
                                                .bank
                                            }
                                          </p>
                                        </div>

                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
                                          <p className="text-xs text-slate-500">
                                            Account
                                          </p>

                                          <p className="font-medium text-slate-900 mt-1">
                                            {
                                              selectedEmployee.bankDetails
                                                .account
                                            }
                                          </p>
                                        </div>

                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
                                          <p className="text-xs text-slate-500">
                                            Branch
                                          </p>

                                          <p className="font-medium text-slate-900 mt-1">
                                            {
                                              selectedEmployee.bankDetails
                                                .branch
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    </TabsContent>
                                  </Tabs>

                                  <Separator />

                                  {/* Employee actions */}

                                  <div className="space-y-2">
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm">
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Approve Employee
                                    </Button>

                                    <Button
                                      variant="outline"
                                      className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-sm"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject / Request Changes
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </SheetContent>
                          </Sheet>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    No employees match your filters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Review control panel                                             */}
        {/* ---------------------------------------------------------------- */}

        <aside className="space-y-4">
          {/* Review */}

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
              <Progress
                value={completionPercentage}
                className="h-2"
              />

              <p className="text-xs text-slate-500">
                {approvedCount} of {totalEmployees} employees approved
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-slate-600">Approved</span>
                  </div>

                  <span className="font-semibold text-slate-900">
                    {approvedCount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-slate-600">Pending</span>
                  </div>

                  <span className="font-semibold text-slate-900">
                    {pendingCount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-slate-600">Rejected</span>
                  </div>

                  <span className="font-semibold text-slate-900">
                    {rejectedCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll totals */}

          <Card className="border-slate-200 shadow-none rounded-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payroll Total
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Gross payroll
                </span>

                <span className="font-semibold text-slate-900">
                  KES {totalGross.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Deductions
                </span>

                <span className="font-semibold text-red-600">
                  -KES {totalDeductions.toLocaleString()}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Net payroll
                </span>

                <span className="font-bold text-slate-900">
                  KES {totalNet.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Secondary payroll details */}

          <Card className="border-slate-200 shadow-none rounded-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Payroll Details
              </CardTitle>
            </CardHeader>

            <CardContent className="p-2">
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-sm bg-[#7F5EFD]/10 flex items-center justify-center">
                    <Award className="h-4 w-4 text-[#7F5EFD]" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Allowances
                    </p>

                    <p className="text-xs text-slate-500">
                      {mockEmployees.reduce(
                        (sum, employee) =>
                          sum + employee.allowances.length,
                        0
                      )}{" "}
                      records · KES{" "}
                      {totalAllowances.toLocaleString()}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-sm bg-slate-100 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-slate-600" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Deductions
                    </p>

                    <p className="text-xs text-slate-500">
                      {mockEmployees.reduce(
                        (sum, employee) =>
                          sum + employee.deductions.length,
                        0
                      )}{" "}
                      records · KES{" "}
                      {totalDeductions.toLocaleString()}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
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
                      3 employees not in payroll
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
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
                      {totalEmployees} payroll employees
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </CardContent>
          </Card>

          {/* Reviewers */}

          <Card className="border-slate-200 shadow-none rounded-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Reviewers
                </CardTitle>

                <span className="text-xs text-slate-400">
                  3 assigned
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {mockReviewers.map((reviewer) => (
                <div key={reviewer.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {reviewer.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        Level {reviewer.level}
                      </p>
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      {reviewer.approved}/{reviewer.total}
                    </span>
                  </div>

                  <Progress
                    value={
                      (reviewer.approved / reviewer.total) * 100
                    }
                    className="h-1.5"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Final actions */}

          <Card className="border-slate-200 shadow-none rounded-sm">
            <CardContent className="p-4 space-y-2">
              <Button
                className="w-full bg-[#7F5EFD] hover:bg-[#6b4de0] text-white rounded-sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Approve Payroll
              </Button>

              <Button
                variant="outline"
                className="w-full rounded-sm border-slate-200"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Request Changes
              </Button>

              <p className="text-[11px] text-center text-slate-400 pt-1">
                All employees must be reviewed before final approval.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}