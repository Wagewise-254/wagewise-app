import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import SplashScreen from "./pages/onboarding/SplashScreen.tsx";
import LoginPage from "./pages/onboarding/auth/LoginPage.tsx";
import RootDashboard from "./pages/dashboard/RootDashboard.tsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import AccountSettings from "./pages/dashboard/AccountSettings.tsx";
import CompanySetup from "./components/dashboard/CompanySetup.tsx";
import { supabase } from "./lib/supabaseClient.ts";
import ModuleDashboard from "./pages/company/layout/moduleDashboard.tsx";
import ModuleLayout from "./pages/company/layout/moduleLayout.tsx";
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
import PayrollLayout from "./pages/company/payroll/PayrollLayout.tsx";
import RunPayroll from "./pages/company/payroll/runPayroll.tsx";
import PayrollHistory from "./pages/company/payroll/PayrollHistory.tsx";
import BenefitSettings from "./pages/company/payroll/benefits/benefitSection.tsx";
import BenefitLayout from "./pages/company/payroll/benefits/benefitsLayout.tsx";
import DeductionLayout from "./pages/company/payroll/deductions/deductionsLayout.tsx";
import AssignBenefits from "./pages/company/payroll/benefits/assignBenefits.tsx";
import AbsentDaysPage from "./pages/company/payroll/benefits/absentDays.tsx";
import AssignDeductions from "./pages/company/payroll/deductions/assignDeductions.tsx";
import PayrollSettingsLayout from "./pages/company/payroll/settings/PayrollSettingsLayout.tsx";
import PayrollWizard from "./components/payroll/runs/PayrollWizard.tsx";
import PayrollReviewStatus from "./components/payroll/runs/PayrollReviewStatus.tsx";
import DeductionSettings from "./pages/company/payroll/deductions/deductionSection.tsx";
import HELBSection from "./pages/company/payroll/deductions/HELBSection.tsx";
import Reviewers from "./pages/company/payroll/settings/reviewers.tsx";
import SendPayslip from "./pages/company/payroll/SendPayslips.tsx";
import PayrollOverview from "./pages/company/payroll/payrollOverview.tsx";
import PayrollSetup from "./components/payroll/settings/PayrollSetup.tsx";
import ReportLayout from "./pages/company/reports/ReportLayout.tsx";
import ReportOverview from "./pages/company/reports/ReportOverview.tsx";
import ReportPreviewPage from "./pages/company/reports/ReportPreviewPage.tsx";
import PayrollRunReports from "./pages/company/reports/PayrollRunReports.tsx";
import AnnualReports from "./pages/company/reports/AnnualReports.tsx";
import P9AReports from "./pages/company/reports/P9A-Reports.tsx";
import SettingsLayout from "./pages/company/settings/SettingsLayout.tsx";
import SettingsOverview from "./pages/company/settings/SettiingsOverview.tsx";
import HRMSettingsLayout from "./pages/company/settings/HRMLayout.tsx";
import JobTitlesSettings from "./pages/company/settings/JobTitles.tsx";
import DepartmentSettings from "./pages/company/settings/Departments.tsx";
import ProfileSettings from "./pages/company/settings/ProfilesSettings.tsx";
import AuditLogs from "./pages/company/settings/AuditLogs.tsx";
import NotFound from "./pages/NotFound.tsx";

const ProtectedRoute = () => {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);

  // If we are still checking the session, show nothing or a spinner
  if (loading) return null;

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

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

        {/* Protected Dashboard routes with layouts */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<RootDashboard />} />
            <Route
              path="/dashboard/account-settings"
              element={<AccountSettings />}
            />
            <Route path="/company-setup" element={<CompanySetup />} />
          </Route>
          {/* Company-specific Dashboard with a Company ID parameter */}
          <Route path="/company/:companyId" element={<ModuleLayout />}>
            <Route index element={<Navigate to="modules" replace />} />
            <Route path="modules" element={<ModuleDashboard />} />
            <Route element={<EmployeeLayout />}>
             <Route index element={<EmployeeSection />} />
              <Route path="employees" element={<EmployeeSection />} />
              <Route path="employees/non-active" element={<NonActiveEmployees />} />
              <Route path="employees/terminated" element={<TerminatedEmployees />} />
            </Route>
            <Route path="employees/add-employee" element={<AddEmployees />} />
            {/* Employee details */}
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
            {/**Payroll specific dashboards */}

            <Route path="payroll" element={<PayrollLayout />}>
              <Route index element={<PayrollOverview />} />
              <Route path="run" element={<RunPayroll />} />
              <Route path="payslips" element={<SendPayslip />} />
              <Route path="history" element={<PayrollHistory />} />
              <Route path="benefits" element={<BenefitLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<BenefitSettings />} />
                <Route path="absent-days" element={<AbsentDaysPage />} />
              </Route>
              <Route path="deductions" element={<DeductionLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<DeductionSettings />} />
                <Route path="helb" element={<HELBSection />} />
              </Route>
              <Route path="settings" element={<PayrollSettingsLayout />}>
                <Route path="reviewers" element={<Reviewers />} />
              </Route>
            </Route>
            <Route path="payroll/:payrollRunId">
              <Route path="wizard" element={<PayrollWizard />} />
              <Route path="review-status" element={<PayrollReviewStatus />} />
            </Route>
            <Route path="benefits/assign" element={<AssignBenefits />} />
            <Route path="deductions/assign" element={<AssignDeductions />} />
            <Route path="payroll/setup" element={<PayrollSetup />} />
            {/**Report specific dashboards */}
            
            <Route path="reports" element={<ReportLayout />}>
              <Route index element={<ReportOverview />} />
              <Route path="overview" element={<ReportOverview />} />
              <Route path="annual" element={<AnnualReports />} />
              <Route path="p9a" element={<P9AReports />} />
              <Route path="report-preview" element={<ReportPreviewPage />} />
              <Route path="payroll-run/:payrollRunId" element={<PayrollRunReports />} />
            </Route>
            {/**Report specific dashboards */}
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<SettingsOverview />} />
              <Route path="overview" element={<SettingsOverview />} />
              <Route path="profiles" element={<ProfileSettings />} />
              <Route element={<HRMSettingsLayout />}>
                <Route path="departments" element={<DepartmentSettings />} />
                <Route path="Job-titles" element={<JobTitlesSettings />} />
              </Route>
              <Route path="logs" element={<AuditLogs />} />
            </Route>
            {/* Catch all for undefined routes under /company/:companyId */}
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* Catch all for undefined protected routes */}
          <Route path="*" element={<NotFound />} />
        </Route>
        {/* Catch all for public routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
};

export default AppRouterWrapper;
