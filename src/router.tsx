import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import SplashScreen from "./pages/onboarding/SplashScreen.tsx";
import LoginPage from "./pages/onboarding/auth/LoginPage.tsx";
import ForgotPasswordPage from "./pages/onboarding/resetPassword/ForgotPasswordPage.tsx";
import VerifyCodePage from "./pages/onboarding/resetPassword/VerifyCodePage.tsx";
import ResetPasswordPage from "./pages/onboarding/resetPassword/ResetPasswordPage.tsx";
import RootDashboard from "./pages/dashboard/RootDashboard.tsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import AccountSettings from "./pages/dashboard/AccountSettings.tsx";
import CompanySetup from "./components/dashboard/CompanySetup.tsx";
import { supabase } from "./lib/supabaseClient.ts";

import MainLayout from "./pages/company/layout/MainLayout.tsx";
import ModuleLayout from "./pages/company/layout/ModuleLayout.tsx";
import NotificationsPage from "./pages/company/notifications/NotificationsPage";
import ModuleDashboard from "./pages/company/dashboard/moduleDashboard.tsx";

import EmployeeSection from "./pages/company/employees/employeeSection.tsx";
import AddEmployees from "./pages/company/employees/AddEmployee.tsx";
import EmployeeDetailsLayout from "./components/company/employees/layouts/EmployeeDetailsLayout.tsx";
import EmployeeLayout from "./components/company/employees/layouts/employeeLayout.tsx";
import NonActiveEmployees from "./pages/company/employees/nonActiveEmployees.tsx";
import TerminatedEmployees from "./pages/company/employees/TerminatedEmployees.tsx";
import EmployeeDeductions from "./pages/company/employees/details/Deductions.tsx";
import PaymentDetails from "./pages/company/employees/details/Payments.tsx";
import EmployeeHistoryPage from "./pages/company/employees/details/History.tsx";
import PersonalDetails from "./pages/company/employees/details/PersonalDetails.tsx";
import ContractDetails from "./pages/company/employees/details/Contracts.tsx";
import EmployeeAllowances from "./pages/company/employees/details/Allowances.tsx";

import OrgLayout from "./pages/company/organization/OrgLayout.tsx";
import DepartmentsPage from "./pages/company/organization/Departments.tsx";
import JobTitlesPage from "./pages/company/organization/JobTitles.tsx";
import SubDepartmentsPage from "./pages/company/organization/SubDepartments.tsx";

import PayrollOverview from "./pages/company/payroll/payrollOverview.tsx";
import RunPayroll from "./pages/company/payroll/runPayroll.tsx";
import PayrollHistory from "./pages/company/payroll/PayrollHistory.tsx";
import PayrollHubPage from "./pages/company/payroll/hub/PayrollHubPage.tsx";
import BenefitSettings from "./pages/company/payroll/benefits/benefitSection.tsx";
import BenefitLayout from "./pages/company/payroll/benefits/benefitsLayout.tsx";
import DeductionLayout from "./pages/company/payroll/deductions/deductionsLayout.tsx";
import AssignBenefits from "./pages/company/payroll/benefits/assignBenefits.tsx";
import AllowanceHistory from "./pages/company/payroll/benefits/AllowanceHistory.tsx";
import DeductionHistory from "./pages/company/payroll/deductions/DeductionHistory.tsx";
import AbsentDaysPage from "./pages/company/payroll/benefits/absentDays.tsx";
import AssignDeductions from "./pages/company/payroll/deductions/assignDeductions.tsx";
import PayrollWizard from "./components/payroll/runs/PayrollWizard.tsx";
import PayrollEligibilityPage from "./pages/company/payroll/runs/PayrollEligibilityPage.tsx";
import PayrollProcessPage from "./pages/company/payroll/PayrollProcessPage.tsx";
//import PayrollReviewPage from "./pages/company/payroll/PayrollReviewPage.tsx";
import PayrollReviewPage from "./pages/company/payroll/reviews/index.tsx";
import PayrollReviewStatus from "./components/payroll/runs/PayrollReviewStatus.tsx";
import PayrollDetailsLayout from "./pages/company/payroll/hub/layout/PayrollDetailsLayout.tsx";
import AllowancesDetailPage from "./pages/company/payroll/hub/details/AllowancesDetailPage.tsx";
import DeductionsDetailPage from "@/pages/company/payroll/hub/details/DeductionsDetailPage.tsx";
import DeductionSettings from "./pages/company/payroll/deductions/deductionSection.tsx";
import PayrollEmployeeLayout from "./pages/company/payroll/hub/layout/PayrollEmployeeLayout.tsx";
import IncludedEmployeesPage from "./pages/company/payroll/hub/details/IncludedEmployeesPage.tsx";
import ExcludedEmployeesPage from "./pages/company/payroll/hub/details/ExcludedEmployeesPage.tsx";
import PayrollRunHubReports from "./pages/company/payroll/hub/PayrollRunHubReports.tsx";
import ReportPreviewHub from "./pages/company/payroll/hub/ReportPreviewHub.tsx";
import PaymentMethodsDetailPage from "./pages/company/payroll/hub/details/PaymentMethodsDetailPage.tsx";
import PayrollPayslipsHub from "./pages/company/payroll/hub/PayrollPayslipsHub.tsx";

import HELBSection from "./pages/company/payroll/deductions/HELBSection.tsx";
import SendPayslip from "./pages/company/payroll/SendPayslips.tsx";
import PayrollSetup from "./components/payroll/settings/PayrollSetup.tsx";

import ReportPreviewPage from "./pages/company/reports/ReportPreviewPage.tsx";
import PayrollRunReports from "./pages/company/reports/PayrollRunReports.tsx";
import AnnualReports from "./pages/company/reports/AnnualReports.tsx";
import P9AReports from "./pages/company/reports/P9A-Reports.tsx";
import ReportOverview from "./pages/company/reports/ReportOverview.tsx";

import CompanySettingsOverviewPage from "./pages/company/settings/SettiingsOverview.tsx";
import SettingsLayout from "./pages/company/settings/SettingsLayout.tsx";
import ProfileSettings from "./pages/company/settings/ProfilesSettings.tsx";
import Reviewers from "./pages/company/settings/reviewers.tsx";
import AuditLogs from "./pages/company/settings/AuditLogs.tsx";
import NotFound from "./pages/NotFound.tsx";

const ProtectedRoute = () => {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);

  if (loading) return null;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

// Layout without sidebar/topbar (blank layout)
const BlankLayout = () => <Outlet />;

const AppRouterWrapper = () => {
  const checkUser = useAuthStore((state) => state.checkUser);
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.setState({
        session,
        user: session?.user ?? null,
      });

      if (session) {
        useAuthStore.getState().loadContext();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          {/* Dashboard routes (outside company context) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<RootDashboard />} />
            <Route
              path="/dashboard/account-settings"
              element={<AccountSettings />}
            />
            <Route path="/company-setup" element={<CompanySetup />} />
          </Route>

          {/* Company routes WITH sidebar + topbar (MainLayout) */}
          <Route path="/company/:companyId" element={<MainLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ModuleDashboard />} />
            <Route path="payroll" element={<PayrollOverview />} />
            <Route path="reports" element={<ReportOverview />} />
            <Route path="settings" element={<CompanySettingsOverviewPage />} />

            {/* Employee list routes (with tabs layout) */}
            <Route path="employees">
              <Route element={<EmployeeLayout />}>
                <Route index element={<EmployeeSection />} />
                <Route path="non-active" element={<NonActiveEmployees />} />
                <Route path="terminated" element={<TerminatedEmployees />} />
              </Route>
            </Route>

            {/*Organization routes */}
            <Route path="organization" element={<OrgLayout />}>
              <Route index element={<DepartmentsPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="job-titles" element={<JobTitlesPage />} />
              <Route path="sub-departments" element={<SubDepartmentsPage />} />
            </Route>

            {/**Payroll specific dashboards */}
            <Route path="payroll">
              <Route index element={<PayrollOverview />} />
              <Route path="run" element={<RunPayroll />} />
              <Route path="eligibility" element={<PayrollEligibilityPage />} />
              <Route path="process" element={<PayrollProcessPage />} />
              <Route path="payslips" element={<SendPayslip />} />
              <Route path="history" element={<PayrollHistory />} />
              <Route path="benefits" element={<BenefitLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<BenefitSettings />} />
                <Route path="assign" element={<AssignBenefits />} />
                <Route path="absent-days" element={<AbsentDaysPage />} />
              </Route>
              <Route path="deductions" element={<DeductionLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<DeductionSettings />} />
                <Route path="assign" element={<AssignDeductions />} />
                <Route path="helb" element={<HELBSection />} />
              </Route>
            </Route>

            {/**Report specific dashboards */}
            <Route path="reports">
              <Route index element={<ReportOverview />} />
              <Route path="overview" element={<ReportOverview />} />
              <Route path="annual" element={<AnnualReports />} />
              <Route path="p9a" element={<P9AReports />} />
              <Route path="report-preview" element={<ReportPreviewPage />} />
              <Route
                path="payroll-run/:payrollRunId"
                element={<PayrollRunReports />}
              />
            </Route>

            {/**Settings specific dashboards */}
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<CompanySettingsOverviewPage />} />
              <Route
                path="overview"
                element={<CompanySettingsOverviewPage />}
              />
              <Route path="profiles" element={<ProfileSettings />} />
              <Route path="reviewers" element={<Reviewers />} />
              <Route path="logs" element={<AuditLogs />} />
            </Route>
          </Route>

          {/* Company routes WITHOUT sidebar + topbar (full page) */}
          <Route path="/company/:companyId" element={<BlankLayout />}>
            <Route path="notifications" element={<NotificationsPage />} />
            {/* Add Employee - Full page without sidebar */}
            <Route path="employees/add-employee" element={<AddEmployees />} />

            {/* Employee Details - Full page without sidebar */}
            <Route
              path="employees/:employeeId"
              element={<EmployeeDetailsLayout />}
            >
              <Route index element={<PersonalDetails />} />
              <Route path="personal" element={<PersonalDetails />} />
              <Route path="contracts" element={<ContractDetails />} />
              <Route path="payments" element={<PaymentDetails />} />
              <Route path="deductions" element={<EmployeeDeductions />} />
              <Route path="allowances" element={<EmployeeAllowances />} />
              <Route path="history" element={<EmployeeHistoryPage />} />
            </Route>

            {/* payroll */}
            <Route path="payroll/:payrollRunId" element={<ModuleLayout />}>
              <Route path="wizard" element={<PayrollWizard />} />
              <Route
                path="review-old-status"
                element={<PayrollReviewStatus />}
              />
              <Route path="review-status" element={<PayrollReviewPage />} />
              <Route path="hub" element={<PayrollHubPage />} />
              <Route path="payment-methods" element={<PaymentMethodsDetailPage />} />
              <Route path="reports" element={<PayrollRunHubReports />} />
              <Route path="reports/preview" element={<ReportPreviewHub />} />
              <Route path="payslips" element={<PayrollPayslipsHub />} />
              <Route element={<PayrollDetailsLayout />}>
                <Route
                  path="hub/allowances"
                  element={<AllowancesDetailPage />}
                />
                <Route
                  path="hub/deductions"
                  element={<DeductionsDetailPage />}
                />
              </Route>
              <Route element={<PayrollEmployeeLayout />}>
                <Route
                  path="employees/included"
                  element={<IncludedEmployeesPage />}
                />
                <Route
                  path="employees/excluded"
                  element={<ExcludedEmployeesPage />}
                />
              </Route>
            </Route>
            <Route
              path="payroll/benefits/history"
              element={<AllowanceHistory />}
            />
            <Route
              path="payroll/deductions/history"
              element={<DeductionHistory />}
            />
            <Route path="payroll/setup" element={<PayrollSetup />} />
          </Route>

          {/* Catch all for undefined routes */}
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
};

export default AppRouterWrapper;
